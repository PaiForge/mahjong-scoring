import {
  MOBILE_PLAN_API_PATH,
  isMobilePlanErrorCode,
  mobilePlanOffersApiUrl,
  parseMobilePlanOffersResponse,
  parseMobilePlanResponse,
  parseMobilePurchaseRecordResponse,
  type MobilePlanErrorCode,
  type MobilePlanOffer,
  type MobilePlanResponse,
  type MobilePurchaseRecordResponse,
} from "@mahjong-scoring/features/billing/mobile-api";

import { APP_PLATFORM } from "../app-version/app-version";
import type { ApiFailure, MobileApiInit } from "../auth/api-client";
import { readPublicMobileApi } from "../auth/read-public-mobile-api";
import {
  domainFailureOf,
  requestMobileApi,
  type MobileApiResult,
} from "../auth/request-mobile-api";
import { iapRecordRequestOf, type IapPurchase } from "./iap";

/**
 * プラン・取引の記録の API の失敗
 *
 * - `serverError` — サーバー側の一時的な失敗（500）。同じ要求を送り直してよい
 * - `rejected` — サーバーが要求そのものを受け付けない 4xx（本文の形・無いパス等）。
 *   送り直しても通らない
 */
export type PlanApiFailure =
  ApiFailure | MobilePlanErrorCode | "serverError" | "rejected";

/** プラン・取引の記録の API の結果 */
export type PlanApiResult<T> = MobileApiResult<T, PlanApiFailure>;

/**
 * 要求を送り、成功なら応答を検証して返す
 * プランAPI要求
 *
 * 409 / 422 / 503 はプランの API 固有の理由（{@link isMobilePlanErrorCode}）に
 * 丸める。認証・回数制限の 4xx（401 / 403 / 429）はその理由のまま、それ以外の
 * 4xx（本文の検証の 400 `invalidRequest`・404 等）は `rejected` にする —
 * `unknown` のままだと購入の同期が「分からない失敗」として完了せず、ストアが
 * 起動のたびに配り直して同じ 4xx を受け続ける。読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 * 回数制限の API（`practice/quota/quota-api.ts`）も同じ理由の集合を返すので、
 * これを通す。
 */
export function requestPlanApi<T>(
  path: string,
  init: MobileApiInit & { readonly asUser: string },
  parse: (body: unknown) => T | undefined,
): Promise<PlanApiResult<T>> {
  return requestMobileApi(path, init, parse, async (response) => {
    const failure = await domainFailureOf(response, isMobilePlanErrorCode);
    return failure === "unknown" &&
      response.status >= 400 &&
      response.status < 500
      ? "rejected"
      : failure;
  });
}

/**
 * プランの状態・販売中の商品・購入履歴を読む
 * プラン取得
 */
export function fetchPlan(
  userId: string,
): Promise<PlanApiResult<MobilePlanResponse>> {
  return requestPlanApi(
    MOBILE_PLAN_API_PATH,
    { asUser: userId },
    parseMobilePlanResponse,
  );
}

/**
 * 自分の OS の販売中の商品を読む（認証なし）。読めなければ undefined
 * 販売中商品取得
 *
 * ゲストも呼ぶため、ログインのトークンを付ける `callMobileApi` を通さない。
 * 販売中の商品はストアの経路（OS）ごとに違うので、OS をクエリに載せる。
 * OS の無い画面確認用の web 版は読まない（undefined）。
 */
export async function fetchPlanOffers(): Promise<
  readonly MobilePlanOffer[] | undefined
> {
  if (APP_PLATFORM === undefined) return undefined;
  const parsed = await readPublicMobileApi(
    mobilePlanOffersApiUrl(APP_PLATFORM),
    parseMobilePlanOffersResponse,
  );
  return parsed?.offers;
}

/**
 * ストアの購入を送って記録する（同じ購入の再送は `duplicate`）
 * 購入送信
 *
 * 送り先のパスと本文は購入を配ったストアのアダプタが組む（App Store は
 * 署名付き取引、Google Play は Product ID と購入トークン）。応答の形は
 * どちらも同じ。送る名義は `userId` に限る — 送る前に別のユーザーへ
 * 切り替わっていたら送らずに `userChanged` を返す。
 */
export function postPurchase(
  userId: string,
  purchase: IapPurchase,
): Promise<PlanApiResult<MobilePurchaseRecordResponse>> {
  const { path, body } = iapRecordRequestOf(purchase);
  return requestPlanApi(
    path,
    { method: "POST", body, asUser: userId },
    parseMobilePurchaseRecordResponse,
  );
}
