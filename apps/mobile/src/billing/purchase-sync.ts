import { isMobilePlanErrorCode } from "@mahjong-scoring/features/billing/mobile-api";
import type { MobileAppleTransactionResponse } from "@mahjong-scoring/features/billing/mobile-api";

import type { PlanApiFailure, PlanApiResult } from "./plan-api";

/**
 * 取引をサーバーへ送った応答から、取引を完了（finish）するかを決める
 * 取引完了の判定
 *
 * - 記録した・記録済み（2xx）→ 完了する
 * - プランの API 固有の理由（4xx。別のアカウントの取引・署名が通らない・
 *   知らない商品・Sandbox を受け付けない）→ 完了する。送り直しても通らず、
 *   完了しないと StoreKit が起動のたびに同じ取引を配り直し、同じ要求を
 *   永久に送り続ける
 * - サーバーが要求を受け付けない 4xx（`rejected`）→ 完了する。送り直しても同じ
 *   400 が返り、完了しないと起動のたびに送り続ける
 * - ユーザー名が無い（409 `usernameRequired`）→ 完了しない。ユーザー名が無いのは
 *   一時的な状態で、決めれば同じ取引が通る。完了すると二度と配られず、取り戻せ
 *   ない（Ask to Buy の承認がログアウト中に届き、ユーザー名の無い別のアカウントで
 *   ログインした等）。サーバーは検証の前に 409 を返すので、起動ごとに 1 回
 *   送り直す費用は小さい。起動中には送り直さない（`isRetryable` に入れない）
 * - サーバーが検証できない（503 `appleUnavailable`）・通信の失敗・一時的な障害・
 *   ログインの失効や切り替え・形の分からない応答 → 完了しない。次の起動で
 *   StoreKit が配り直し、そのとき送り直す
 *
 * 分からない失敗を「完了しない」に倒すのは、完了した取引は StoreKit が二度と
 * 配らず、記録し損ねた購入を取り戻せないため（送り直しの方が安い）。
 */
export function shouldFinishAfter(
  result: PlanApiResult<MobileAppleTransactionResponse>,
): boolean {
  if ("value" in result) return true;
  if (result.error === "rejected") return true;
  return (
    isMobilePlanErrorCode(result.error) &&
    result.error !== "appleUnavailable" &&
    result.error !== "usernameRequired"
  );
}

/**
 * 失敗の理由ごとの、起動中に間を置いて送り直すか
 *
 * 表にして理由を漏れなく並べる。理由が増えたら型検査がここで止め、
 * 送り直すかを決めさせる（`||` の羅列では、増えた理由が黙って
 * 「送り直さない」に落ちる）。
 */
const RETRYABLE: Readonly<Record<PlanApiFailure, boolean>> = {
  // 通信・サーバーの一時的な障害。送り直せば通るかもしれない
  network: true,
  serverError: true,
  appleUnavailable: true,
  authUnavailable: true,
  rateLimited: true,
  // ユーザー名を決めれば通るが、起動中には決まらない（{@link shouldFinishAfter}）
  usernameRequired: false,
  // 送り直しても同じ答えが返る
  ownedByAnotherAccount: false,
  invalidTransaction: false,
  unknownProduct: false,
  sandboxNotAccepted: false,
  rejected: false,
  // ログインが失効・変わった。同じ名義で送り直しても通らない
  unauthorized: false,
  deleted: false,
  banned: false,
  userChanged: false,
  // 形の分からない応答。次の起動で StoreKit が配り直したときに送る
  unknown: false,
};

/**
 * 送り直せば通るかもしれない失敗か
 * 送り直し判定
 *
 * 購入の直後に記録できなかったとき、起動中に間を置いて送り直すかを決める。
 * 送り直さない失敗でも、取引を完了するかは別に {@link shouldFinishAfter} が決める。
 */
export function isRetryable(error: PlanApiFailure): boolean {
  return RETRYABLE[error];
}

/**
 * 購入の復元の結果（画面が出す 1 つの知らせ）
 * 復元結果
 *
 * - `ownedByAnotherAccount` — 別のアカウントに記録された取引があった
 * - `restored` — 1 件以上を新しく記録した
 * - `failed` — 送れなかった取引があった（通信・一時的な障害）。送り直せば通るかもしれない
 * - `nothingToRestore` — 端末に購入が無い、またはすべて記録済み（その他の 4xx を含む）
 */
export type RestoreSummary =
  "ownedByAnotherAccount" | "restored" | "failed" | "nothingToRestore";

/**
 * 復元で送った取引それぞれの応答を、出す知らせ 1 つにまとめる
 * 復元結果の集約
 *
 * 別のアカウントの取引を最優先にする — 本人が別のアカウントで買った Pro を
 * 探しているなら、それが次の行動（ログインし直す）を決める知らせだから。
 * 次に新しく記録できたこと、その次に送れなかったことを知らせる。
 */
export function summarizeRestore(
  results: readonly PlanApiResult<MobileAppleTransactionResponse>[],
): RestoreSummary {
  if (
    results.some(
      (result) => "error" in result && result.error === "ownedByAnotherAccount",
    )
  )
    return "ownedByAnotherAccount";
  if (
    results.some(
      (result) => "value" in result && result.value.outcome === "recorded",
    )
  )
    return "restored";
  if (results.some((result) => !shouldFinishAfter(result))) return "failed";
  return "nothingToRestore";
}
