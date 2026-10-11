import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileAppleTransactionRequest,
  MobileAppleTransactionResponse,
} from "@mahjong-scoring/features/billing/mobile-api";

import { getAppleSignedDataVerifier } from "../billing/apple/default-verifier";
import {
  recordAppleTransaction,
  type AppleRecordResult,
} from "../billing/apple/record";
import type { AppleSignedDataVerifier } from "../billing/apple/verifier";

import { authorizeMobileRequest } from "./auth";
import { buildMobilePlanResponse, mobilePlanError } from "./plan";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

/**
 * 本文の上限。取引そのものの上限（`JWS_MAX_LENGTH`）の 2 倍を取り、JSON の
 * 包みの分の余裕を持たせる
 */
const BODY_MAX_BYTES = 32 * 1024;

/**
 * 署名付き取引の長さの上限。これを超えるものは読まずに 400 で弾く
 *
 * 実物は証明書の鎖（x5c に 3 枚）を含んで 5〜6KB。上限を超えた取引はアプリが
 * 「送り直しても通らない」として完了して捨てるので、正規の取引を超えさせない
 * ために実物の 2 倍以上を取る。
 */
const JWS_MAX_LENGTH = 16_384;

const requestSchema: z.ZodType<MobileAppleTransactionRequest> = z.object({
  jws: z.string().min(1).max(JWS_MAX_LENGTH),
});

const ROUTE = "POST /api/mobile/v1/iap/apple/transactions";

/**
 * App Store の署名付き取引を検証し、ユーザーの購入として記録する（アプリ向け）
 * 取引記録API（アプリ向け）
 *
 * アプリは購入の直後と「購入を復元」で、StoreKit から受け取った署名付き取引を
 * ここへ送る。同じ取引を何度送ってもよい（記録は取引 ID で冪等）。記録の規則は
 * `recordAppleTransaction`、ここは HTTP の層だけを持つ。
 *
 * 記録する本人は Bearer のユーザー。取引の `appAccountToken` は見ない — 退会して
 * 再登録した人の復元を通すため（`recordAppleTransaction` の TSDoc）。
 *
 * 応答はアプリが取引を完了（finish）するかの判断に使われる。2xx と 4xx の後に
 * 完了し、503 と通信の失敗だけ未完了のまま残して次の起動で送り直す
 * （`MOBILE_PLAN_ERROR_CODES` の TSDoc）。
 *
 * - 200 `recorded` / `duplicate` — 記録した・記録済み。記録後のプランの状態を添える。
 *   返金済みの取引を履歴として記録した場合も `recorded`（状態に特典は付かない）
 * - 409 `usernameRequired` / `ownedByAnotherAccount`
 * - 422 `invalidTransaction` / `unknownProduct` / `sandboxNotAccepted`
 * - 403 `deleted` — 退会を受け付けたユーザー（認証の後に退会が始まった競合）
 * - 503 `appleUnavailable` — 検証器が無い（設定の不備）・Apple に届かない
 *
 * @param getVerifier - 署名検証器を返す関数。テストは偽物を返す関数を渡す
 */
export async function handleRecordAppleTransaction(
  request: Request,
  getVerifier: () =>
    AppleSignedDataVerifier | undefined = getAppleSignedDataVerifier,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "recordAppleTransaction");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobilePlanError("usernameRequired");
  const body = await parseMobileBody(request, requestSchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;

  const verifier = getVerifier();
  if (!verifier) return mobilePlanError("appleUnavailable");
  const verified = await verifier.verifyTransaction(body.data.jws);
  if (!verified.ok) {
    return mobilePlanError(
      verified.reason === "unavailable"
        ? "appleUnavailable"
        : "invalidTransaction",
    );
  }

  const userId = auth.user.id;
  try {
    const now = new Date();
    const recorded = await recordAppleTransaction(userId, verified.value, now);
    const outcome = responseOutcomeOf(recorded);
    if (typeof outcome !== "string") return outcome;
    return mobileJson<MobileAppleTransactionResponse>({
      ...(await buildMobilePlanResponse(userId, now)),
      outcome,
    });
  } catch (error) {
    return mobileServerError(ROUTE, "記録に失敗", error);
  }
}

/**
 * 記録の結果を、成功なら応答の `outcome` に、失敗ならエラーの応答に写す
 *
 * 記録しない理由のうち、アプリが文言を出し分けるもの（知らない商品・Sandbox）
 * だけを個別の理由にし、残り（別のアプリ・商品の種類・Family Sharing）は
 * `invalidTransaction` にまとめる。どれも正規のアプリからは起きず、本人に
 * 説明できることが無い。
 */
function responseOutcomeOf(
  recorded: AppleRecordResult,
): MobileAppleTransactionResponse["outcome"] | NextResponse {
  switch (recorded.outcome) {
    case "recorded":
    case "refunded":
      return "recorded";
    case "duplicate":
      return "duplicate";
    case "ownedByAnotherAccount":
      return mobilePlanError("ownedByAnotherAccount");
    case "accountUnavailable":
      return mobileJson({ error: "deleted" }, { status: 403 });
    case "rejected":
      switch (recorded.reason) {
        case "unknownProduct":
        case "sandboxNotAccepted":
          return mobilePlanError(recorded.reason);
        case "unknownBundle":
        case "unexpectedType":
        case "familyShared":
          return mobilePlanError("invalidTransaction");
      }
  }
}
