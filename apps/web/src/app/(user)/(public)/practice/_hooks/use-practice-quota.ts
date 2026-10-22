"use client";

import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";
import {
  usePracticeQuotaControl,
  type PracticeQuotaControl,
  type PracticeQuotaSource,
} from "@mahjong-scoring/features/quota/use-practice-quota-control";
import { createPracticeQuotaGate } from "@mahjong-scoring/features/quota/use-practice-quota-gate";

import {
  beginPracticeQuestion,
  peekPracticeQuota,
} from "../_actions/begin-practice-question";

export type { PracticeQuotaControl } from "@mahjong-scoring/features/quota/use-practice-quota-control";

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
 * 出題許可の問い合わせ先（Server Action）
 * 回数制限問い合わせ先
 *
 * サーバーが明示的に「上限」「レート制限」と答えたときだけ止める。届かない
 * （オフライン・一時障害）ときは確かめられなかった扱いで、ゲートが出題だけ
 * 許可する（fail-open。設計は `createPracticeQuotaGate`）。
 */
const source: PracticeQuotaSource = {
  async ask(menu) {
    const result = await beginPracticeQuestion(menu);
    if (!("error" in result)) return { kind: "answer", answer: result };
    if (result.error === "rateLimited") return { kind: "rateLimited" };
    // invalidMenu は UI のバグ。利用者を止める理由にはならない
    console.warn("beginPracticeQuestion rejected the menu:", menu);
    return { kind: "unverified" };
  },
  async peek(menu) {
    try {
      const result = await peekPracticeQuota(menu);
      return "error" in result ? undefined : result;
    } catch (error) {
      console.warn("peekPracticeQuota failed; keeping the last gate:", error);
      return undefined;
    }
  },
};

/**
 * エンドレス練習の無料枠ゲート
 * 練習回数ゲート
 *
 * 問題の生成（ブラウザ側・同期）の前に Server Action `beginPracticeQuestion`
 * を 1 回挟む。盤面は「生成する」の代わりに `requestQuestion()` を呼ぶだけで、
 * 消費の仕組み（DB / cookie / Pro の無制限）を知らない。設計（fail-open・
 * 古い返事を捨てる・アンマウント後の返事を捨てない）は features の
 * `createPracticeQuotaGate` と {@link usePracticeQuotaControl}。
 *
 * @param menu - 練習（回数制限の単位）
 * @param generate - 許可されたときに呼ぶ生成処理。参照が変わっても最新のものを呼ぶ
 */
export function usePracticeQuota(
  menu: QuotaMenu,
  generate: () => void,
): PracticeQuotaControl {
  return usePracticeQuotaControl(gates, menu, source, generate);
}
