"use client";

import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";

import type { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import {
  QUOTA_MENUS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import {
  beginPracticeQuestion,
  peekPracticeQuota,
} from "../_actions/begin-practice-question";

/**
 * 直近の出題許可の結果
 * 出題ゲート
 *
 * - `open` — 直前の問題は許可された。`remaining` は今日の残り（Pro は `"unlimited"`）
 * - `blocked` — 無料枠を使い切った。問題は生成していない
 * - `unverified` — 通信失敗で出題だけ許可。残数不明・特典なし
 * - `rateLimited` — IP のレート制限に掛かった（連打・自動化）。問題は生成していない
 */
export type PracticeQuotaGate =
  | {
      readonly kind: "open";
      readonly remaining: number | "unlimited";
      readonly limit: number | "unlimited";
      readonly benefits: readonly PlanBenefit[];
    }
  | {
      readonly kind: "blocked";
      readonly limit: number;
      readonly signedIn: boolean;
      readonly benefits: readonly PlanBenefit[];
    }
  | { readonly kind: "rateLimited" }
  | { readonly kind: "unverified" };

export interface PracticeQuotaControl {
  /**
   * 1 問始める。サーバーに無料枠の消費を聞き、許可されたら `generate` を呼ぶ。
   * 許可されなければ `gate` が `blocked` になり、呼び出し側はペイウォールを出す
   */
  readonly requestQuestion: () => Promise<void>;
  /**
   * 残数と特典を消費せずに取り直す。盤面を離れて戻ってきたとき、解答中の
   * 問題を引き継ぎながら、離れている間の購入・ログイン・日付の変わり目を
   * 表示に反映させる。失敗・レート制限のときは今の `gate` を保つ
   */
  readonly refreshGate: () => Promise<void>;
  /** サーバーの返事を待っている間 true。「次の問題へ」はこの間押せなくする */
  readonly isChecking: boolean;
  /** 直近の結果。まだ一度も聞いていなければ undefined */
  readonly gate: PracticeQuotaGate | undefined;
}

/** 練習 1 つぶんのゲートの状態 */
interface MenuQuotaState {
  readonly gate: PracticeQuotaGate | undefined;
  readonly isChecking: boolean;
}

interface PracticeQuotaStoreState {
  readonly menus: Readonly<Partial<Record<QuotaMenu, MenuQuotaState>>>;
}

const IDLE: MenuQuotaState = { gate: undefined, isChecking: false };

/**
 * 練習ごとのゲートの状態
 * 出題ゲートストア
 *
 * 盤面のローカル state ではなくモジュールスコープに置く。練習の問題を持つ
 * ストア（`useAgariScoreStore` 等）と同じく、盤面を離れても捨てられない。
 * 盤面に戻ってきたとき、問題と一緒に残数・特典の表示と「返事を待っている
 * 最中か」を引き継ぐため。読む側は `usePracticeQuota()` を通す。
 */
export const usePracticeQuotaStore = create<PracticeQuotaStoreState>(() => ({
  menus: {},
}));

/** 練習ごとの要求の連番。後から始めた要求の返事だけを採用するために使う */
const requestSeq: Partial<Record<QuotaMenu, number>> = {};

function readMenu(menu: QuotaMenu): MenuQuotaState {
  return usePracticeQuotaStore.getState().menus[menu] ?? IDLE;
}

function patchMenu(menu: QuotaMenu, patch: Partial<MenuQuotaState>): void {
  usePracticeQuotaStore.setState((state) => ({
    menus: { ...state.menus, [menu]: { ...readMenu(menu), ...patch } },
  }));
}

/**
 * 盤面に戻ってきたとき、ストアに残った問題をそのまま続けてよいか
 * 練習再開可否
 *
 * 続けてよいのは、同じ条件で解答中の問題（または生成に失敗した結果）が
 * 残っていて、ゲートがそれを許可した状態（`open` / `unverified`）のまま
 * か、返事を待っている最中のとき。待っている最中なら、返事が届けば
 * 問題はストアに入る（返事はアンマウント後も捨てない）ので聞き直さない。
 *
 * 上限（`blocked`）やレート制限で止まっていたときは続けない。ペイウォール
 * からログインして戻る経路がここを通り、聞き直さないと新しい枠が付いた
 * のにペイウォールのまま止まる。聞き直しても、まだ上限なら消費されない。
 *
 * @param menu - 練習
 * @param practice - 練習ストアの状態（出題条件が同じであることは呼び出し側が確かめる）
 */
export function canResumePractice(
  menu: QuotaMenu,
  practice: {
    readonly hasQuestion: boolean;
    readonly generationFailed: boolean;
  },
): boolean {
  const { gate, isChecking } = readMenu(menu);
  if (isChecking) return true;
  if (!practice.hasQuestion && !practice.generationFailed) return false;
  return gate?.kind === "open" || gate?.kind === "unverified";
}

/** テスト用。モジュールスコープの状態を初期化する */
export function _resetPracticeQuota(): void {
  usePracticeQuotaStore.setState({ menus: {} });
  for (const menu of QUOTA_MENUS) {
    delete requestSeq[menu];
  }
}

/**
 * エンドレス練習の無料枠ゲート
 * 練習回数ゲート
 *
 * 問題の生成（ブラウザ側・同期）の前に Server Action `beginPracticeQuestion`
 * を 1 回挟む。盤面は「生成する」の代わりに `requestQuestion()` を呼ぶだけで、
 * 消費の仕組み（DB / cookie / Pro の無制限）を知らない。
 *
 * @design 通信の失敗は許可して通す（fail-open）
 *
 * Server Action に届かない（オフライン・一時障害）ときは問題を生成する。
 * 練習が止まる方が、無料枠を 1 問多く使われるより損が大きい。サーバーが
 * 明示的に「上限」「レート制限」と答えたときだけ止める。
 *
 * @design 古い返事は捨てる
 *
 * 連打や自動次へで要求が重なったとき、後から始めた要求の返事だけを採用する。
 * 先の返事で生成し、後の返事でも生成すると 1 回の操作で 2 問進む。
 *
 * @design アンマウント後の返事は捨てない
 *
 * 返事を待つ間に盤面を離れても、サーバーはもう 1 問ぶん消費している。
 * 返事が届いたら問題を生成してストアに入れておけば、戻ってきたときに
 * その問題を続けられる（捨てると戻った盤面がもう 1 問消費する）。生成先の
 * 練習ストアも、このゲートの状態もモジュールスコープなので、盤面が無くても
 * 書ける。
 *
 * @param menu - 練習（回数制限の単位）
 * @param generate - 許可されたときに呼ぶ生成処理。参照が変わっても最新のものを呼ぶ
 */
export function usePracticeQuota(
  menu: QuotaMenu,
  generate: () => void,
): PracticeQuotaControl {
  const { gate, isChecking } = usePracticeQuotaStore(
    (state) => state.menus[menu] ?? IDLE,
  );
  const generateRef = useRef(generate);

  // 最新の generate を効果の中で控える（描画中に ref へ書かない）
  useEffect(() => {
    generateRef.current = generate;
  });

  const requestQuestion = useCallback(async () => {
    const seq = (requestSeq[menu] ?? 0) + 1;
    requestSeq[menu] = seq;
    const isCurrent = () => requestSeq[menu] === seq;
    patchMenu(menu, { isChecking: true });

    try {
      let result: Awaited<ReturnType<typeof beginPracticeQuestion>>;
      try {
        result = await beginPracticeQuestion(menu);
      } catch (error) {
        if (!isCurrent()) return;
        console.warn(
          "beginPracticeQuestion failed; allowing the question:",
          error,
        );
        // 出題だけを fail-open にする。以前の残数や Pro 特典を引き継がない。
        patchMenu(menu, { gate: { kind: "unverified" } });
        generateRef.current();
        return;
      }
      if (!isCurrent()) return;

      if ("error" in result) {
        if (result.error === "rateLimited") {
          patchMenu(menu, { gate: { kind: "rateLimited" } });
          return;
        }
        // invalidMenu は UI のバグ。利用者を止める理由にはならない
        console.warn("beginPracticeQuestion rejected the menu:", menu);
        patchMenu(menu, { gate: { kind: "unverified" } });
        generateRef.current();
        return;
      }

      if (result.allowed) {
        generateRef.current();
        patchMenu(menu, {
          gate: {
            kind: "open",
            remaining: result.remaining,
            limit: result.limit,
            benefits: result.benefits,
          },
        });
      } else {
        patchMenu(menu, {
          gate: {
            kind: "blocked",
            limit: typeof result.limit === "number" ? result.limit : 0,
            signedIn: result.signedIn,
            benefits: result.benefits,
          },
        });
      }
    } finally {
      if (isCurrent()) patchMenu(menu, { isChecking: false });
    }
  }, [menu]);

  const refreshGate = useCallback(async () => {
    // 連番は進めない（出題の要求を追い越す立場にない）。取り直している間に
    // 新しい出題が始まったら、その返事の方が新しいのでこちらは捨てる
    const seq = requestSeq[menu];
    let result: Awaited<ReturnType<typeof peekPracticeQuota>>;
    try {
      result = await peekPracticeQuota(menu);
    } catch (error) {
      console.warn("peekPracticeQuota failed; keeping the last gate:", error);
      return;
    }
    if (requestSeq[menu] !== seq || "error" in result) return;
    // 表示している問題はもう許可済みなので、残りが 0 でも `open`（「この
    // 問題で最後」）。`blocked` にするのは次の出題を聞いたときだけ
    patchMenu(menu, {
      gate: {
        kind: "open",
        remaining: result.remaining,
        limit: result.limit,
        benefits: result.benefits,
      },
    });
  }, [menu]);

  return { requestQuestion, refreshGate, isChecking, gate };
}
