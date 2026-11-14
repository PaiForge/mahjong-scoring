import "server-only";

import type { NextResponse } from "next/server";

import type { MobileAppPlatform } from "@mahjong-scoring/features/app-version/mobile-api";
import type {
  MobilePlanErrorCode,
  MobilePlanOffer,
  MobilePlanOffersResponse,
  MobilePlanPurchase,
  MobilePlanResponse,
  MobilePlanStatus,
} from "@mahjong-scoring/features/billing/mobile-api";
import {
  OFFER_KEYS,
  PurchaseKind,
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";

import { readAppleProductIds } from "../billing/apple/env";
import { readGoogleProductIds } from "../billing/google/env";
import {
  offersPurchase,
  planStatusOf,
  purchaseProviderOf,
  purchaseStateOf,
  type PlanStatus,
} from "../billing/plan-status";
import { listPurchases } from "../billing/purchases";
import type { Purchase } from "../db";
import { listBenefitGrants } from "../entitlements/benefit-grants";
import { getActiveBenefits } from "../entitlements/has-benefit";

import { authorizeMobileRequest } from "./auth";
import { mobilePlatformOf } from "./platform";
import { limitPublicMobileRequest } from "./public-rate-limit";
import {
  mobileJson,
  mobileServerError,
  mobileUsernameRequired,
} from "./response";

/** プラン・取引の記録の API 固有の失敗の理由ごとの HTTP ステータス */
const PLAN_ERROR_STATUS = {
  usernameRequired: 409,
  ownedByAnotherAccount: 409,
  invalidTransaction: 422,
  unknownProduct: 422,
  sandboxNotAccepted: 422,
  appleUnavailable: 503,
  storeUnavailable: 503,
  purchasePending: 409,
} as const satisfies Record<MobilePlanErrorCode, number>;

/**
 * プラン・取引の記録の API 固有の失敗の応答
 * プランAPIエラー応答
 *
 * 理由の意味とアプリの扱い（取引を完了するか）は `MOBILE_PLAN_ERROR_CODES` の TSDoc。
 */
export function mobilePlanError(code: MobilePlanErrorCode): NextResponse {
  return mobileJson<{ error: MobilePlanErrorCode }>(
    { error: code },
    { status: PLAN_ERROR_STATUS[code] },
  );
}

/**
 * OS ごとの販売中の商品の Product ID の読み出し
 * 経路別Product ID読み出し
 *
 * OS（ストアの経路）ごとに Product ID の出どころが違う。表にして、OS を足したら
 * ここへの追記を型検査に要求させる。
 */
const PRODUCT_ID_READERS: Readonly<
  Record<
    MobileAppPlatform,
    () => Readonly<Partial<Record<OfferKey, string>>> | undefined
  >
> = {
  ios: readAppleProductIds,
  android: readGoogleProductIds,
};

/**
 * その経路の販売中の商品（ストアの Product ID）。販売していなければ空
 * 販売中商品
 *
 * iOS は App Store、Android は Google Play の Product ID。Product ID が設定
 * された売り方だけを並べる。買い切りが無ければその経路では販売していない
 * 扱いで空（`readAppleProductIds` / `readGoogleProductIds` の TSDoc）。
 *
 * @param platform - 販売中の商品を引く OS（ストアの経路）
 */
function offersFor(platform: MobileAppPlatform): MobilePlanOffer[] {
  const ids = PRODUCT_ID_READERS[platform]();
  if (!ids) return [];
  return OFFER_KEYS.flatMap((key) => {
    const productId = ids[key];
    return productId ? [{ key, productId }] : [];
  });
}

/** 表示用のプランの状態を応答の形に写す（日時は ISO 8601） */
function mobilePlanStatusOf(status: PlanStatus): MobilePlanStatus {
  switch (status.kind) {
    case "free":
    case "lifetime":
      return { kind: status.kind };
    case "pass":
      return { kind: "pass", until: status.until.toISOString() };
    case "granted":
      return status.until === undefined
        ? { kind: "granted" }
        : { kind: "granted", until: status.until.toISOString() };
  }
}

/** 購入履歴の 1 行を応答の形に写す。金額は載せない（契約の「金額を返さない」） */
function mobilePlanPurchaseOf(
  purchase: Purchase,
  now: Date,
): MobilePlanPurchase {
  return {
    provider: purchaseProviderOf(purchase),
    // DB の CHECK が pass / lifetime 以外を弾くので、lifetime でなければ pass
    kind:
      purchase.kind === PurchaseKind.Lifetime
        ? PurchaseKind.Lifetime
        : PurchaseKind.Pass,
    createdAt: purchase.createdAt.toISOString(),
    ...(purchase.expiresAt
      ? { expiresAt: purchase.expiresAt.toISOString() }
      : {}),
    state: purchaseStateOf(purchase, now),
  };
}

/**
 * ユーザーのプランの状態・特典・販売中の商品・購入履歴を組み立てる
 * プラン状態応答組み立て
 *
 * プランの状態の API と、取引の記録の API の応答（記録した後の状態）が使う。
 * 状態の要約と追加購入の可否は web の購入状況のページと同じ関数
 * （`planStatusOf` / `offersPurchase`）で決め、画面と規則を食い違わせない。
 * 販売中の商品は要求したアプリの経路（iOS は App Store、Android は Google Play
 * の Product ID）のもので、web の Stripe の Price ID は見ない。
 *
 * 購入履歴・付与の読み出しは失敗すると空に、特典の判定は特典なしに倒れる
 * （どれも web のマイページと同じ）。
 */
export async function buildMobilePlanResponse(
  userId: string,
  now: Date,
  platform: MobileAppPlatform,
): Promise<MobilePlanResponse> {
  const [purchases, grants, benefits] = await Promise.all([
    listPurchases(userId),
    listBenefitGrants(userId),
    getActiveBenefits(userId, now),
  ]);
  return {
    status: mobilePlanStatusOf(planStatusOf(purchases, grants, now)),
    benefits: [...benefits],
    canPurchase: offersPurchase(purchases, grants, now),
    offers: offersFor(platform),
    purchases: purchases.map((purchase) => mobilePlanPurchaseOf(purchase, now)),
  };
}

/**
 * プランの状態・販売中の商品・購入履歴を返す（アプリ向け）
 * プラン状態API（アプリ向け）
 *
 * アプリのプラン画面が開くたびと購入の後に読む。ユーザー名を決める前は
 * 409 `usernameRequired`（購入はユーザー名を決めた人のもの。マイページと同じ）。
 * 販売中の商品はヘッダ `X-App-Platform` の OS のもの（無ければ iOS。`mobilePlatformOf`）。
 */
export async function handleReadPlan(request: Request): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobilePlan");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobileUsernameRequired();
  try {
    return mobileJson<MobilePlanResponse>(
      await buildMobilePlanResponse(
        auth.user.id,
        new Date(),
        mobilePlatformOf(request),
      ),
    );
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/plan",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * 販売中の商品の一覧を返す（アプリ向け。認証なし）
 * 販売中商品API（アプリ向け）
 *
 * ゲストが販売中かを知るための入口。アプリはゲストの練習の回数制限を
 * 販売中の間だけ掛ける（払う手段の無いペイウォールを出さない）。認証が
 * 無いので IP の回数だけを絞る。
 *
 * 販売中の商品はクエリ `?platform=` の OS のもの（無ければ iOS。
 * `mobilePlatformOf`）。
 *
 * 返すのは Product ID だけ。Product ID はストアのアプリのページから
 * 誰でも知れる公開情報で、これを知っても買えるものは増えない（購入は
 * ストアを通り、記録はサーバーがストアに確かめてから行う）。
 */
export async function handleReadPlanOffers(
  request: Request,
): Promise<NextResponse> {
  const rateLimited = await limitPublicMobileRequest("readMobilePlanOffers");
  if (rateLimited) return rateLimited;
  return mobileJson<MobilePlanOffersResponse>({
    offers: offersFor(mobilePlatformOf(request)),
  });
}
