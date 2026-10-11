import {
  MOBILE_APPLE_TRANSACTIONS_API_PATH,
  MOBILE_PLAN_API_PATH,
  MOBILE_PLAN_OFFERS_API_PATH,
  isMobilePlanErrorCode,
  parseMobileAppleTransactionResponse,
  parseMobilePlanOffersResponse,
  parseMobilePlanResponse,
  type MobileAppleTransactionResponse,
  type MobilePlanErrorCode,
  type MobilePlanOffer,
  type MobilePlanResponse,
} from "@mahjong-scoring/features/billing/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
  type MobileApiInit,
} from "../auth/api-client";
import { SITE_URL } from "../lib/app-site-url";

/**
 * プラン・取引の記録の API の失敗
 *
 * `serverError` はサーバー側の一時的な失敗（500）で、同じ要求を送り直してよい。
 */
export type PlanApiFailure = ApiFailure | MobilePlanErrorCode | "serverError";

/** プラン・取引の記録の API の結果 */
export type PlanApiResult<T> =
  { readonly value: T } | { readonly error: PlanApiFailure };

/**
 * 要求を送り、成功なら応答を検証して返す
 *
 * 409 / 422 / 503 はプランの API 固有の理由（{@link isMobilePlanErrorCode}）に
 * 丸める。読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 */
async function request<T>(
  path: string,
  init: MobileApiInit & { readonly asUser: string },
  parse: (body: unknown) => T | undefined,
): Promise<PlanApiResult<T>> {
  const response = await callMobileApi(path, init);
  if (typeof response === "string") return { error: response };
  if (response.ok) {
    const value = parse(await response.json().catch(() => undefined));
    return value === undefined ? { error: "unknown" } : { value };
  }
  const error = await errorOf(response.clone());
  if (isMobilePlanErrorCode(error)) return { error };
  if (response.status >= 500 && response.status !== 503)
    return { error: "serverError" };
  return { error: await apiFailureOf(response) };
}

/**
 * プランの状態・販売中の商品・購入履歴を読む
 * プラン取得
 */
export function fetchPlan(
  userId: string,
): Promise<PlanApiResult<MobilePlanResponse>> {
  return request(
    MOBILE_PLAN_API_PATH,
    { asUser: userId },
    parseMobilePlanResponse,
  );
}

/**
 * 販売中の商品を読む（認証なし）。読めなければ undefined
 * 販売中商品取得
 *
 * ゲストも呼ぶため、ログインのトークンを付ける `callMobileApi` を通さない。
 */
export async function fetchPlanOffers(): Promise<
  readonly MobilePlanOffer[] | undefined
> {
  try {
    const response = await fetch(`${SITE_URL}${MOBILE_PLAN_OFFERS_API_PATH}`);
    if (!response.ok) return undefined;
    const parsed = parseMobilePlanOffersResponse(
      await response.json().catch(() => undefined),
    );
    return parsed?.offers;
  } catch {
    return undefined;
  }
}

/**
 * App Store の署名付き取引を送って購入を記録する（同じ取引の再送は `duplicate`）
 * 取引送信
 *
 * 送る名義は `userId` に限る — 送る前に別のユーザーへ切り替わっていたら
 * 送らずに `userChanged` を返す。
 */
export function postAppleTransaction(
  userId: string,
  jws: string,
): Promise<PlanApiResult<MobileAppleTransactionResponse>> {
  return request(
    MOBILE_APPLE_TRANSACTIONS_API_PATH,
    { method: "POST", body: { jws }, asUser: userId },
    parseMobileAppleTransactionResponse,
  );
}
