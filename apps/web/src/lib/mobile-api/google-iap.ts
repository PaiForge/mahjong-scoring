import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileGooglePurchaseRequest,
  MobilePurchaseRecordResponse,
} from "@mahjong-scoring/features/billing/mobile-api";

import { getGooglePurchaseVerifier } from "../billing/google/default-verifier";
import {
  recordGooglePurchase,
  type GoogleRecordResult,
} from "../billing/google/record";
import type { GooglePurchaseVerifier } from "../billing/google/verifier";

import { authorizeMobileRequest } from "./auth";
import { buildMobilePlanResponse, mobilePlanError } from "./plan";
import { parseMobileBody } from "./request";
import {
  mobileDeleted,
  mobileJson,
  mobileServerError,
  mobileUsernameRequired,
} from "./response";

/** 本文の上限。購入トークンの上限（`PURCHASE_TOKEN_MAX_LENGTH`）に JSON の包みの余裕を足す */
const BODY_MAX_BYTES = 8 * 1024;

/** Product ID の長さの上限（`purchases.google_product_id` の varchar(255)） */
const PRODUCT_ID_MAX_LENGTH = 255;

/**
 * 購入トークンの長さの上限。これを超えるものは問い合わせずに 400 で弾く
 *
 * 実物の購入トークンは数百文字。上限を超えた購入はアプリが「送り直しても
 * 通らない」として完了して捨てるので、正規のトークンを超えさせないよう
 * 余裕を取る。
 */
const PURCHASE_TOKEN_MAX_LENGTH = 2048;

const requestSchema: z.ZodType<MobileGooglePurchaseRequest> = z.object({
  productId: z.string().min(1).max(PRODUCT_ID_MAX_LENGTH),
  purchaseToken: z.string().min(1).max(PURCHASE_TOKEN_MAX_LENGTH),
});

const ROUTE = "POST /api/mobile/v1/iap/google/purchases";

/**
 * Google Play の購入を確かめ、ユーザーの購入として記録する（アプリ向け）
 * 購入記録API（Google Play・アプリ向け）
 *
 * Android アプリは購入の直後と起動時の送り直しで、Play Billing から受け取った
 * Product ID と購入トークンをここへ送る。同じ購入を何度送ってもよい（記録は
 * 購入トークンで冪等）。記録の規則は `recordGooglePurchase`、ここは HTTP の層
 * だけを持つ。記録する本人は Bearer のユーザー。
 *
 * App Store の取引の記録（`handleRecordAppleTransaction`）とはパスを分け、
 * 応答の形（`MobilePurchaseRecordResponse`）は揃える。Apple のパスと失敗の理由
 * （`appleUnavailable`）はストアに出ている iOS アプリが読むので変えず、新しい
 * 理由（`storeUnavailable`・`purchasePending`）はこのパスでだけ返す。
 *
 * 応答はアプリが購入を完了（acknowledge）するかの判断に使われる。2xx と 4xx の
 * 後に完了し、409 `usernameRequired` / `purchasePending`（一時的な状態）・503・
 * 通信の失敗は未完了のまま残す（送り直す時機は `MOBILE_PLAN_ERROR_CODES` の TSDoc）。
 *
 * - 200 `recorded` / `duplicate` — 記録した・記録済み。記録後のプランの状態を添える
 * - 409 `usernameRequired` / `ownedByAnotherAccount` / `purchasePending`
 * - 422 `invalidTransaction` / `unknownProduct` / `sandboxNotAccepted`
 * - 403 `deleted` — 退会を受け付けたユーザー（認証の後に退会が始まった競合）
 * - 503 `storeUnavailable` — 検証器が無い（本物は未実装で、開発用のモックを
 *   選ばない環境では常にこれ）・Play に届かない
 *
 * @param getVerifier - 検証器を返す関数。テストは偽物を返す関数を渡す
 */
export async function handleRecordGooglePurchase(
  request: Request,
  getVerifier: () =>
    GooglePurchaseVerifier | undefined = getGooglePurchaseVerifier,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "recordGooglePurchase");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobileUsernameRequired();
  const body = await parseMobileBody(request, requestSchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;

  const verifier = getVerifier();
  if (!verifier) return mobilePlanError("storeUnavailable");
  const verified = await verifier.verifyPurchase(body.data);
  if (!verified.ok) {
    return mobilePlanError(
      verified.reason === "unavailable"
        ? "storeUnavailable"
        : "invalidTransaction",
    );
  }

  const userId = auth.user.id;
  try {
    const now = new Date();
    const recorded = await recordGooglePurchase(userId, verified.value, now);
    const outcome = responseOutcomeOf(recorded);
    if (typeof outcome !== "string") return outcome;
    return mobileJson<MobilePurchaseRecordResponse>({
      ...(await buildMobilePlanResponse(userId, now, "android")),
      outcome,
    });
  } catch (error) {
    return mobileServerError(ROUTE, "記録に失敗", error);
  }
}

/**
 * 記録の結果を、成功なら応答の `outcome` に、失敗ならエラーの応答に写す
 *
 * 記録しない理由のうち、アプリが文言を出し分けるもの（知らない商品・テストの
 * 購入）と送り直しで通りうるもの（保留中）だけを個別の理由にする。テストの
 * 購入は Apple の Sandbox と同じ意味なので `sandboxNotAccepted` で返し、アプリの
 * 文言を共有する。残り（別のアプリ・取り消し済み）は `invalidTransaction` に
 * まとめる — どちらも送り直しても通らず、本人に説明できることが無い。
 */
function responseOutcomeOf(
  recorded: GoogleRecordResult,
): MobilePurchaseRecordResponse["outcome"] | NextResponse {
  switch (recorded.outcome) {
    case "recorded":
      return "recorded";
    case "duplicate":
      return "duplicate";
    case "ownedByAnotherAccount":
      return mobilePlanError("ownedByAnotherAccount");
    case "accountUnavailable":
      return mobileDeleted();
    case "rejected":
      switch (recorded.reason) {
        case "unknownProduct":
          return mobilePlanError("unknownProduct");
        case "testNotAccepted":
          return mobilePlanError("sandboxNotAccepted");
        case "pending":
          return mobilePlanError("purchasePending");
        case "unknownPackage":
        case "cancelled":
          return mobilePlanError("invalidTransaction");
      }
  }
}
