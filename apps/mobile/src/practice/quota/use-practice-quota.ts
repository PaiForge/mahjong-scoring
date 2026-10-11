import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { create } from "zustand";
import type { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import {
  limitedAnswer,
  unlimitedAnswer,
  type BeginPracticeQuestionResult,
  type QuotaAudience,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import {
  PRACTICE_QUOTA_LIMITS,
  QUOTA_MENUS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import { supabase } from "../../auth/supabase-client";
import { IAP_AVAILABLE } from "../../billing/iap-availability";
import { fetchPlan } from "../../billing/plan-api";
import { loadPlanOffers } from "../../billing/use-plan-offers";
import {
  consumeStoredGuestQuota,
  peekStoredGuestQuota,
} from "./guest-quota-storage";
import { beginPracticeQuota, peekPracticeQuota } from "./quota-api";

/**
 * 直近の出題許可の結果（web の `PracticeQuotaGate` と同じ形）
 * 出題ゲート
 *
 * - `open` — 直前の問題は許可された。`remaining` は今日の残り（無制限は `"unlimited"`）
 * - `blocked` — 無料枠を使い切った。問題は生成していない
 * - `unverified` — 通信失敗で出題だけ許可。残数不明・特典なし
 * - `rateLimited` — サーバーのレート制限に掛かった（連打）。問題は生成していない
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
 * 盤面のローカル state ではなくモジュールスコープに置く（web と同じ）。
 * 返事を待つ間に盤面を離れても、届いた返事で問題を作ってストアに入れられる
 * ように、生成先の練習ストアと同じ寿命にする。読む側は `usePracticeQuota()` を通す。
 */
const usePracticeQuotaStore = create<PracticeQuotaStoreState>(() => ({
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

/** テスト用。モジュールスコープの状態を初期化する */
export function _resetPracticeQuota(): void {
  usePracticeQuotaStore.setState({ menus: {} });
  for (const menu of QUOTA_MENUS) {
    delete requestSeq[menu];
  }
}

/**
 * 出題許可の問い合わせの結果
 *
 * - `answer` — 規則どおりの答え（web の出題開始と同じ形）
 * - `rateLimited` — サーバーのレート制限（止める）
 * - `unverified` — 確かめられなかった（出題開始なら許可して通す・残数問い合わせなら今の表示を保つ）
 */
type QuotaOutcome =
  | { readonly kind: "answer"; readonly answer: BeginPracticeQuestionResult }
  | { readonly kind: "rateLimited" }
  | { readonly kind: "unverified" };

/** 消費するか（出題開始）、見るだけか（残数問い合わせ） */
type QuotaMode = "begin" | "peek";

/** ログイン中のユーザー。ゲスト・接続先の無いビルドは undefined */
async function currentUserId(): Promise<string | undefined> {
  if (!supabase) return undefined;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.id;
  } catch {
    return undefined;
  }
}

/**
 * 販売していないときに出し分けに使う特典。ゲストは空、ログイン中は `/plan` の特典
 *
 * 回数は数えないが、回答時間の計測（`practice_tools`）は web で買った Pro でも
 * 出す。読めなければ特典なし（特典の判定は fail-closed。web と同じ）。
 */
async function benefitsWhileNotOnSale(
  userId: string | undefined,
): Promise<readonly PlanBenefit[]> {
  if (userId === undefined) return [];
  const result = await fetchPlan(userId);
  return "value" in result ? result.value.benefits : [];
}

/** 端末で数えるゲストの答え。宛先の `signedIn` はユーザー名の無いログイン中なら true */
async function guestOutcome(
  menu: QuotaMenu,
  mode: QuotaMode,
  signedIn: boolean,
): Promise<QuotaOutcome> {
  const limit = PRACTICE_QUOTA_LIMITS[menu].anonymous;
  const usage: QuotaUsage =
    mode === "begin"
      ? await consumeStoredGuestQuota(menu, limit)
      : await peekStoredGuestQuota(menu, limit);
  const audience: QuotaAudience = { signedIn, benefits: [] };
  return { kind: "answer", answer: limitedAnswer(audience, limit, usage) };
}

/**
 * 出題許可を聞く。答えの出どころは 3 つ
 * 出題許可問い合わせ
 *
 * 1. アプリ内課金の無い端末（Android）・販売していない → 常に無制限（回数制限の
 *    API を呼ばない）
 * 2. ログイン中 → サーバーの回数制限（web と同じ表。1 日の枠は web と 1 つ）
 * 3. ゲスト・ユーザー名を決めていない人 → 端末で数える（上限は未ログインの値）
 *
 * @design ユーザー名を決めていない人はゲストと同じ数え方に落とす
 *
 * web ではその状態の人もログイン済みの枠を使うが、アプリ向けの API は
 * ユーザー名を要求する（`usernameRequired`）。枠の差は小さく、ユーザー名の
 * 設定へ送る導線はホームにあるので、API を広げずに端末の数え方へ落とす。
 * ペイウォールの宛先はログイン中として扱い（`signedIn: true`）、「ログインする」
 * ではなく Pro プランへ送る（プラン画面がユーザー名の設定へ案内する）。
 */
async function askQuota(
  menu: QuotaMenu,
  mode: QuotaMode,
): Promise<QuotaOutcome> {
  const userId = await currentUserId();
  const signedIn = userId !== undefined;
  if (!IAP_AVAILABLE) {
    return {
      kind: "answer",
      answer: unlimitedAnswer({ signedIn, benefits: [] }),
    };
  }
  const offers = await loadPlanOffers();
  if (offers.length === 0) {
    return {
      kind: "answer",
      answer: unlimitedAnswer({
        signedIn,
        benefits: await benefitsWhileNotOnSale(userId),
      }),
    };
  }
  if (userId !== undefined) {
    const result =
      mode === "begin"
        ? await beginPracticeQuota(userId, menu)
        : await peekPracticeQuota(userId, menu);
    if ("value" in result) {
      return { kind: "answer", answer: { ...result.value, signedIn: true } };
    }
    if (result.error === "rateLimited") return { kind: "rateLimited" };
    // 通信の失敗・サーバーの障害・ログインの切り替わり・要求を受け付けない 4xx は
    // 確かめられなかった扱い
    if (result.error !== "usernameRequired") return { kind: "unverified" };
  }
  return guestOutcome(menu, mode, signedIn);
}

/**
 * 1 問始める。枠を 1 つ消費し、許可されたら `generate` を呼ぶ
 * 出題要求
 *
 * 盤面のフック（{@link usePracticeQuota}）の `requestQuestion` の中身。
 * 設計（fail-open・古い返事を捨てる・アンマウント後の返事を捨てない）は
 * フックの TSDoc。
 *
 * @param generate - 許可されたときに呼ぶ生成処理。返事が届いた時点で呼ぶ
 */
export async function requestPracticeQuestion(
  menu: QuotaMenu,
  generate: () => void,
): Promise<void> {
  const seq = (requestSeq[menu] ?? 0) + 1;
  requestSeq[menu] = seq;
  const isCurrent = () => requestSeq[menu] === seq;
  patchMenu(menu, { isChecking: true });

  try {
    let outcome: QuotaOutcome;
    try {
      outcome = await askQuota(menu, "begin");
    } catch (error) {
      console.warn(
        "practice quota check failed; allowing the question:",
        error,
      );
      outcome = { kind: "unverified" };
    }
    if (!isCurrent()) return;

    switch (outcome.kind) {
      case "rateLimited":
        patchMenu(menu, { gate: { kind: "rateLimited" } });
        return;
      case "unverified":
        // 出題だけを fail-open にする。以前の残数や特典を引き継がない
        patchMenu(menu, { gate: { kind: "unverified" } });
        generate();
        return;
      case "answer": {
        const { answer } = outcome;
        if (answer.allowed) {
          generate();
          patchMenu(menu, {
            gate: {
              kind: "open",
              remaining: answer.remaining,
              limit: answer.limit,
              benefits: answer.benefits,
            },
          });
        } else {
          patchMenu(menu, {
            gate: {
              kind: "blocked",
              limit: typeof answer.limit === "number" ? answer.limit : 0,
              signedIn: answer.signedIn,
              benefits: answer.benefits,
            },
          });
        }
        return;
      }
      default: {
        const exhaustive: never = outcome;
        return exhaustive;
      }
    }
  } finally {
    if (isCurrent()) patchMenu(menu, { isChecking: false });
  }
}

/**
 * 今日の残りと特典を消費せずに読む。確かめられなければ undefined
 * 残数読み込み
 *
 * 盤面の表示の取り直し（{@link refreshPracticeQuota}）と、練習一覧のカードの
 * 残数が同じ経路で読む。
 */
export async function peekPracticeQuotaAnswer(
  menu: QuotaMenu,
): Promise<BeginPracticeQuestionResult | undefined> {
  try {
    const outcome = await askQuota(menu, "peek");
    return outcome.kind === "answer" ? outcome.answer : undefined;
  } catch (error) {
    console.warn("practice quota peek failed:", error);
    return undefined;
  }
}

/**
 * 残数と特典を消費せずに取り直し、ゲートに写す
 * 残数再取得
 *
 * 盤面のフックの `refreshGate` の中身。失敗・レート制限のときは今の
 * ゲートを保つ。取り直している間に新しい出題が始まったら、その返事の方が
 * 新しいのでこちらは捨てる（連番は進めない）。表示している問題はもう
 * 許可済みなので、残りが 0 でも `open`（「この問題で最後」）。
 */
export async function refreshPracticeQuota(menu: QuotaMenu): Promise<void> {
  const seq = requestSeq[menu];
  const answer = await peekPracticeQuotaAnswer(menu);
  if (requestSeq[menu] !== seq || answer === undefined) return;
  patchMenu(menu, {
    gate: {
      kind: "open",
      remaining: answer.remaining,
      limit: answer.limit,
      benefits: answer.benefits,
    },
  });
}

/** 練習のいまのゲート（テストと盤面の外から読む） */
export function readPracticeQuotaGate(
  menu: QuotaMenu,
): PracticeQuotaGate | undefined {
  return readMenu(menu).gate;
}

export interface PracticeQuotaControl {
  /**
   * 1 問始める。枠の消費を聞き、許可されたら `generate` を呼ぶ。許可されな
   * ければ `gate` が `blocked` になり、呼び出し側はペイウォールを出す
   */
  readonly requestQuestion: () => Promise<void>;
  /**
   * 盤面を開いたときの最初の 1 問。前の練習のゲート（ペイウォール等）を
   * 消してから聞く — 消さないと、返事が届くまで前回のペイウォールが出る
   */
  readonly requestFirstQuestion: () => Promise<void>;
  /** 残数と特典を消費せずに取り直す。失敗・レート制限のときは今の `gate` を保つ */
  readonly refreshGate: () => Promise<void>;
  /** 返事を待っている間 true。「次の問題へ」はこの間押せなくする */
  readonly isChecking: boolean;
  /** 直近の結果。まだ一度も聞いていなければ undefined */
  readonly gate: PracticeQuotaGate | undefined;
}

/**
 * 和了形・聴牌形の点数計算の回数制限のゲート（web の `usePracticeQuota`）
 * 練習回数ゲート
 *
 * 問題の生成（端末の中・同期）の前に回数制限の問い合わせを 1 回挟む。盤面は
 * 「生成する」の代わりに `requestQuestion()` を呼ぶだけで、答えの出どころ
 * （サーバー・端末・販売していない間の無制限）を知らない。
 *
 * @design 通信の失敗は許可して通す（fail-open）
 *
 * サーバーに届かないときは問題を生成する。練習が止まる方が、無料枠を 1 問
 * 多く使われるより損が大きい。サーバーが明示的に「上限」「レート制限」と
 * 答えたときだけ止める。
 *
 * @design 古い返事は捨てる
 *
 * 連打や自動で次へで要求が重なったとき、後から始めた要求の返事だけを採用する。
 * 先の返事で生成し、後の返事でも生成すると 1 回の操作で 2 問進む。
 *
 * @design アンマウント後の返事は捨てない
 *
 * 返事を待つ間に盤面を離れても、サーバーはもう 1 問ぶん消費している。
 * 届いた返事で問題を生成してストアに入れる（生成先の練習ストアもこの
 * ゲートもモジュールスコープなので、盤面が無くても書ける）。
 *
 * @design 盤面に戻ってきたときの問題の引き継ぎ（web の `canResumePractice`）は持たない
 *
 * web は盤面を離れて戻ってきたとき（料金ページを見てブラウザバック等）、
 * ストアに残った問題を消費し直さずに続ける。アプリの盤面は開くたびに出題
 * 条件をストアへ移して最初の問題を作り直す（設定画面の「開始」からしか
 * 開かない）ので、引き継ぐ経路が無い。代わりに盤面を開いたまま別の画面
 * （ログイン・プラン画面）から戻ってきたときは、前面に戻るたびに
 * ペイウォールなら聞き直し（まだ上限なら消費されない）、それ以外なら残数と
 * 特典だけを取り直す。ログイン・購入をしてきた人をペイウォールに止めない。
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

  const requestQuestion = useCallback(
    () => requestPracticeQuestion(menu, () => generateRef.current()),
    [menu],
  );

  const requestFirstQuestion = useCallback(() => {
    patchMenu(menu, { gate: undefined });
    return requestQuestion();
  }, [menu, requestQuestion]);

  const refreshGate = useCallback(() => refreshPracticeQuota(menu), [menu]);

  // 開いた直後のフォーカスは最初の問題の要求と重なるので飛ばす
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      const { gate: current, isChecking: checking } = readMenu(menu);
      if (checking || current === undefined) return;
      if (current.kind === "blocked") void requestQuestion();
      else void refreshGate();
    }, [menu, requestQuestion, refreshGate]),
  );

  return {
    requestQuestion,
    requestFirstQuestion,
    refreshGate,
    isChecking,
    gate,
  };
}
