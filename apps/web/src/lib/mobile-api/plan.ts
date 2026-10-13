import "server-only";

import type { NextResponse } from "next/server";

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
} from "@mahjong-scoring/features/billing/plans";

import { readAppleProductIds } from "../billing/apple/env";
import {
  blocksNewPurchase,
  planStatusOf,
  purchaseProviderOf,
  purchaseStateOf,
  type PlanStatus,
} from "../billing/plan-status";
import { listPurchases } from "../billing/purchases";
import { getClientIp } from "../client-ip";
import type { Purchase } from "../db";
import { listBenefitGrants } from "../entitlements/benefit-grants";
import { getActiveBenefits } from "../entitlements/has-benefit";
import { checkIpRateLimitGuard, IP_RATE_LIMITS } from "../rate-limit-ip";

import { authorizeMobileRequest } from "./auth";
import { mobileJson, mobileServerError } from "./response";

/** プラン・取引の記録の API 固有の失敗の理由ごとの HTTP ステータス */
const PLAN_ERROR_STATUS = {
  usernameRequired: 409,
  ownedByAnotherAccount: 409,
  invalidTransaction: 422,
  unknownProduct: 422,
  sandboxNotAccepted: 422,
  appleUnavailable: 503,
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
 * 販売中の商品（App Store の Product ID）。販売していなければ空
 * 販売中商品
 *
 * Product ID が設定された売り方だけを並べる。買い切りが無ければ販売していない
 * 扱いで空（`readAppleProductIds` の TSDoc）。
 */
function appleOffers(): MobilePlanOffer[] {
  const ids = readAppleProductIds();
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
 * （`planStatusOf` / `blocksNewPurchase`）で決め、画面と規則を食い違わせない。
 * 販売中の商品はアプリの経路（App Store の Product ID）のもので、web の
 * Stripe の Price ID は見ない。
 *
 * 購入履歴・付与の読み出しは失敗すると空に、特典の判定は特典なしに倒れる
 * （どれも web のマイページと同じ）。
 */
export async function buildMobilePlanResponse(
  userId: string,
  now: Date,
): Promise<MobilePlanResponse> {
  const [purchases, grants, benefits] = await Promise.all([
    listPurchases(userId),
    listBenefitGrants(userId),
    getActiveBenefits(userId, now),
  ]);
  return {
    status: mobilePlanStatusOf(planStatusOf(purchases, grants, now)),
    benefits: [...benefits],
    canPurchase: !purchases.some((purchase) =>
      blocksNewPurchase(purchase, now),
    ),
    offers: appleOffers(),
    purchases: purchases.map((purchase) => mobilePlanPurchaseOf(purchase, now)),
  };
}

/**
 * プランの状態・販売中の商品・購入履歴を返す（アプリ向け）
 * プラン状態API（アプリ向け）
 *
 * アプリのプラン画面が開くたびと購入の後に読む。ユーザー名を決める前は
 * 409 `usernameRequired`（購入はユーザー名を決めた人のもの。マイページと同じ）。
 */
export async function handleReadPlan(request: Request): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobilePlan");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobilePlanError("usernameRequired");
  try {
    return mobileJson<MobilePlanResponse>(
      await buildMobilePlanResponse(auth.user.id, new Date()),
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
 * 返すのは Product ID だけ。Product ID は App Store のアプリのページから
 * 誰でも知れる公開情報で、これを知っても買えるものは増えない（購入は
 * StoreKit を通り、記録は署名付き取引の検証を通る）。
 */
export async function handleReadPlanOffers(): Promise<NextResponse> {
  if (
    checkIpRateLimitGuard(
      await getClientIp(),
      "readMobilePlanOffers",
      IP_RATE_LIMITS.readMobilePlanOffers,
    )
  ) {
    return mobileJson({ error: "rateLimited" }, { status: 429 });
  }
  return mobileJson<MobilePlanOffersResponse>({ offers: appleOffers() });
}
