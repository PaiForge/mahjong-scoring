import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import type { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import {
  limitedAnswer,
  unlimitedAnswer,
  type BeginPracticeQuestionResult,
  type QuotaAudience,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import type { QuotaOutcome } from "@mahjong-scoring/features/quota/gate";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";
import {
  usePracticeQuotaControl,
  type PracticeQuotaControl as SharedPracticeQuotaControl,
  type PracticeQuotaSource,
} from "@mahjong-scoring/features/quota/use-practice-quota-control";
import { createPracticeQuotaGate } from "@mahjong-scoring/features/quota/use-practice-quota-gate";

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
 * 練習ごとのゲートの状態（設計は `createPracticeQuotaGate`。web と同じ）。
 * 読む側は `usePracticeQuota()` を通す
 */
const gates = createPracticeQuotaGate();

/**
 * 販売していない間の特典（ユーザー ID → `/plan` の特典）
 *
 * 販売していない間は 1 問ごとに出題許可を聞くので、毎回 `/plan` を読むと
 * 1 問ごとに 1 要求になる。起動中はユーザーごとに控え、プランが変わった
 * 合図（{@link clearPlanBenefitsCache}）で捨てる。読めなかった（空）ときは
 * 控えない — 次の問いで読み直す。
 */
const benefitsCache = new Map<string, Promise<readonly PlanBenefit[]>>();

/**
 * 販売していない間の特典の控えを捨てる
 * 特典キャッシュ破棄
 *
 * プランの読み直しの合図（`invalidatePlan`。取引の記録・復元の後）から呼ぶ。
 */
export function clearPlanBenefitsCache(): void {
  benefitsCache.clear();
}

/** テスト用。モジュールスコープの状態を初期化する */
export function _resetPracticeQuota(): void {
  gates.reset();
  benefitsCache.clear();
}

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
 * 読めた特典は控える（{@link benefitsCache}）。
 */
function benefitsWhileNotOnSale(
  userId: string | undefined,
): Promise<readonly PlanBenefit[]> {
  if (userId === undefined) return Promise.resolve([]);
  const cached = benefitsCache.get(userId);
  if (cached !== undefined) return cached;
  const loading = fetchPlan(userId).then((result) => {
    if ("value" in result) return result.value.benefits;
    // 失敗は控えない。読んでいる間に捨てられていれば、別の要求を消さない
    if (benefitsCache.get(userId) === loading) benefitsCache.delete(userId);
    return [];
  });
  benefitsCache.set(userId, loading);
  return loading;
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
 * 今日の残りと特典を消費せずに読む。確かめられなければ undefined
 * 残数読み込み
 *
 * 盤面の表示の取り直し（{@link practiceQuotaSource} の `peek`）と、練習一覧の
 * カードの残数が同じ経路で読む。
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
 * 盤面の回数制限の操作（{@link usePracticeQuota} の戻り値）
 * 回数制限操作
 *
 * web と共有する操作（features の `PracticeQuotaControl`）に、開いた直後の
 * 1 問を足したもの。
 */
export interface PracticeQuotaControl extends SharedPracticeQuotaControl {
  /**
   * 盤面を開いたときの最初の 1 問。前の練習のゲート（ペイウォール等）を
   * 消してから聞く — 消さないと、返事が届くまで前回のペイウォールが出る
   */
  readonly requestFirstQuestion: () => Promise<void>;
}

/**
 * 出題許可の問い合わせ先（{@link askQuota}。答えの出どころは 3 つ）
 * 回数制限問い合わせ先
 *
 * 盤面のフック（{@link usePracticeQuota}）が共有フックに渡すもの。
 * ゲートへの写し方（fail-open・古い返事の破棄・取り直し）は features の
 * `createPracticeQuotaGate` が持つので、このモジュールが確かめるのは
 * 問い合わせ先の答えまで（テストはこれを直接呼ぶ）。
 */
export const practiceQuotaSource: PracticeQuotaSource = {
  ask: (menu) => askQuota(menu, "begin"),
  peek: peekPracticeQuotaAnswer,
};

/**
 * 和了形・聴牌形の点数計算の回数制限のゲート（web の `usePracticeQuota`）
 * 練習回数ゲート
 *
 * 問題の生成（端末の中・同期）の前に回数制限の問い合わせを 1 回挟む。盤面は
 * 「生成する」の代わりに `requestQuestion()` を呼ぶだけで、答えの出どころ
 * （サーバー・端末・販売していない間の無制限。{@link askQuota}）を知らない。
 * 設計（fail-open・古い返事を捨てる・アンマウント後の返事を捨てない）は
 * features の `createPracticeQuotaGate` と {@link usePracticeQuotaControl}。
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
  const control = usePracticeQuotaControl(
    gates,
    menu,
    practiceQuotaSource,
    generate,
  );
  const { requestQuestion, refreshGate } = control;

  const requestFirstQuestion = useCallback(() => {
    gates.clear(menu);
    return requestQuestion();
  }, [menu, requestQuestion]);

  // 開いた直後のフォーカスは最初の問題の要求と重なるので飛ばす
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      const { gate: current, isChecking: checking } = gates.read(menu);
      if (checking || current === undefined) return;
      if (current.kind === "blocked") void requestQuestion();
      else void refreshGate();
    }, [menu, requestQuestion, refreshGate]),
  );

  return { ...control, requestFirstQuestion };
}
