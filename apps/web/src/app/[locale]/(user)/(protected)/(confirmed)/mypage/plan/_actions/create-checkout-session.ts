"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { isOfferKey } from "@mahjong-scoring/features/billing/plans";
import { openCheckout, type CheckoutError } from "@/lib/billing/checkout";
import { SITE_URL } from "@/config";
import { requestOrigin } from "@/lib/csrf";
import { logExternalError } from "@/lib/log-error";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

export type CreateCheckoutSessionError =
  UserActionGuardErrorCode | "invalidOffer" | CheckoutError | "checkoutFailed";

/**
 * Stripe Checkout を作って決済画面へ送る
 * Checkout作成
 *
 * 成功時は `redirect()` で Stripe の決済画面へ飛ぶので、戻り値の `success`
 * には到達しない。失敗はエラーコードで返し、UI が辞書（`plan.errors.*`）で
 * 文言にする。
 *
 * - ガードは `guardUserAction`（IP レート制限と認証 + BAN。Server Action は
 *   POST の入口なので、ページのガードとは別にここで見る）
 * - 有効な購入があれば売らない。未完了の購入手続きは再利用する
 * - `customer` は `stripe_customers` から（無ければ作る）。購入の所有者は
 *   この対応で決まる（`purchases.ts`）
 * - 戻り先は `requestOrigin()`（今いる環境）。無ければ `SITE_URL`
 *
 * @design 言語はクライアントが明示で渡す
 * 購入ボタンを置いたページの言語（`locale`）を引数で受け、`openCheckout` に
 * 渡す。予約に保存され、Stripe の Checkout の表示言語・キャンセルの戻り先・
 * 完了の着地の言語になる。next-intl の `requestLocale` が Server Action の
 * 要求に付くかには依らない（実測が無く、引数 1 つで済みテストで固定できる）。
 * クライアントの入力なので `isSupportedLocale` で絞り、無効・省略は日本語
 * （既存の呼び出しと同じ）。改ざんされても変わるのは表示と着地の言語だけ。
 *
 * @param offer - 売り方（`"pass"` | `"lifetime"`）。クライアントの入力なので絞る
 * @param locale - 購入ボタンを置いたページの言語（省略・不正値は日本語）
 */
export async function createCheckoutSession(
  offer: string,
  locale?: string,
): Promise<ActionResult<CreateCheckoutSessionError>> {
  if (!isOfferKey(offer)) return { error: "invalidOffer" };
  const checkoutLocale =
    locale !== undefined && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  const guard = await guardUserAction("createCheckoutSession");
  if ("error" in guard) return guard;
  const { user } = guard;

  const origin = requestOrigin(await headers()) ?? SITE_URL;
  let checkoutUrl: string;
  try {
    const result = await openCheckout(
      user.id,
      user.email,
      offer,
      origin,
      checkoutLocale,
    );
    if ("error" in result) return result;
    checkoutUrl = result.url;
  } catch (error) {
    logExternalError(
      "createCheckoutSession",
      "failed to create a Checkout session",
      error,
    );
    return { error: "checkoutFailed" };
  }

  if (!checkoutUrl) return { error: "checkoutFailed" };
  redirect(checkoutUrl);
}
