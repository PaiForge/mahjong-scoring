"use client";

import { useCallback, useEffect, useRef } from "react";

import type { PracticeQuotaGate } from "@mahjong-scoring/features/quota/gate";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";
import { createPracticeQuotaGate } from "@mahjong-scoring/features/quota/use-practice-quota-gate";

import {
  beginPracticeQuestion,
  peekPracticeQuota,
} from "../_actions/begin-practice-question";

export type { PracticeQuotaGate } from "@mahjong-scoring/features/quota/gate";

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

/**
 * 練習ごとのゲートの状態（設計は `createPracticeQuotaGate`）。読む側は
 * `usePracticeQuota()` を通す
 */
const gates = createPracticeQuotaGate();

/** テスト用。ゲートのストアを直接読む */
export const usePracticeQuotaStore = gates.useStore;

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
  const { gate, isChecking } = gates.read(menu);
  if (isChecking) return true;
  if (!practice.hasQuestion && !practice.generationFailed) return false;
  return gate?.kind === "open" || gate?.kind === "unverified";
}

/** テスト用。モジュールスコープの状態を初期化する */
export function _resetPracticeQuota(): void {
  gates.reset();
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
  const { gate, isChecking } = gates.useMenuState(menu);
  const generateRef = useRef(generate);

  // 最新の generate を効果の中で控える（描画中に ref へ書かない）
  useEffect(() => {
    generateRef.current = generate;
  });

  const requestQuestion = useCallback(
    () =>
      gates.request(
        menu,
        async () => {
          const result = await beginPracticeQuestion(menu);
          if (!("error" in result)) return { kind: "answer", answer: result };
          if (result.error === "rateLimited") return { kind: "rateLimited" };
          // invalidMenu は UI のバグ。利用者を止める理由にはならない
          console.warn("beginPracticeQuestion rejected the menu:", menu);
          return { kind: "unverified" };
        },
        () => generateRef.current(),
      ),
    [menu],
  );

  const refreshGate = useCallback(
    () =>
      gates.refresh(menu, async () => {
        try {
          const result = await peekPracticeQuota(menu);
          return "error" in result ? undefined : result;
        } catch (error) {
          console.warn(
            "peekPracticeQuota failed; keeping the last gate:",
            error,
          );
          return undefined;
        }
      }),
    [menu],
  );

  return { requestQuestion, refreshGate, isChecking, gate };
}
