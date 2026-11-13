import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobilePracticeQuotaRequest,
  MobilePracticeQuotaResponse,
} from "@mahjong-scoring/features/billing/mobile-api";
import {
  isQuotaMenu,
  QUOTA_MENUS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import { isAppleIapOnSale } from "../billing/apple/env";
import { isGoogleIapOnSale } from "../billing/google/env";
import type { BeginPracticeQuestionResult } from "@mahjong-scoring/features/quota/answer";
import { beginUserQuota, peekUserQuota } from "../practice-quota/user-quota";

import { authorizeMobileRequest } from "./auth";
import { parseMobileBody } from "./request";
import {
  mobileInvalidRequest,
  mobileJson,
  mobileServerError,
  mobileUsernameRequired,
} from "./response";

const BODY_MAX_BYTES = 1024;

// 回数制限の対象でない練習名は、本文の形が違うときと同じ理由（400）で弾く
const beginSchema: z.ZodType<MobilePracticeQuotaRequest> = z.object({
  menu: z.enum(QUOTA_MENUS),
});

/**
 * アプリのどちらかの経路（App Store か Google Play）で Pro を販売中か
 * アプリ内課金の販売可否（全経路）
 *
 * 回数制限の API は要求から経路（OS）を読まない。申告した OS で `proOnSale` が
 * 変わると「android と名乗れば数えない」経路ができ、要求の申告で制限を外す
 * ことになる。そこで、アプリのどれか 1 つの経路で売っていれば数える。
 *
 * 片方の経路だけで売っている期間に、売っていない経路の端末へ払えない
 * ペイウォールを出さないのは端末の役目: アプリは自分の経路の販売中の商品
 * （`GET /plan/offers?platform=`）が空なら回数制限の API を呼ばない。
 */
function isProOnSaleInApp(): boolean {
  return isAppleIapOnSale() || isGoogleIapOnSale();
}

/** web の答えからアプリ向けの形へ。アプリ向け API は常にログイン済みなので `signedIn` を落とす */
function mobileQuotaResponseOf({
  allowed,
  remaining,
  limit,
  benefits,
}: BeginPracticeQuestionResult): NextResponse {
  return mobileJson<MobilePracticeQuotaResponse>({
    allowed,
    remaining,
    limit,
    benefits,
  });
}

/**
 * 1 問始める前に回数制限の枠を 1 つ消費する（アプリ向け）
 * 出題開始API（アプリ向け）
 *
 * web の出題開始（`beginPracticeQuestion`）と同じ表・同じ規則で数える
 * （`beginUserQuota`）。web とアプリで 1 日の枠は 1 つ。販売中かの判定だけは
 * アプリの経路のもので、App Store か Google Play のどちらかで販売中なら数え、
 * どちらでも販売していない間は無制限で通す（{@link isProOnSaleInApp}）。要求の
 * OS（`X-App-Platform`）は読まない — 申告で制限を外す経路を作らないため。
 * 自分の経路で売っていない端末に払えないペイウォールを出さないのは、端末が
 * 自分の経路の販売中の商品が空ならこの API を呼ばないことで防ぐ。
 *
 * 回数の消費が DB の失敗で数えられないときは許可して通す（web と同じ fail-open）。
 * ゲストはこの API を呼ばない（端末の中で数える）。ユーザー名を決める前は
 * 409 `usernameRequired`。
 */
export async function handleBeginPracticeQuota(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(
    request,
    "mobileBeginPracticeQuestion",
  );
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobileUsernameRequired();
  const body = await parseMobileBody(request, beginSchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;
  const { menu } = body.data;
  try {
    return mobileQuotaResponseOf(
      await beginUserQuota(auth.user.id, menu, new Date(), isProOnSaleInApp()),
    );
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/practice-quota/begin",
      "回数制限の判定に失敗",
      error,
    );
  }
}

/**
 * 今日の残りと特典を消費せずに読む（アプリ向け）
 * 残数問い合わせAPI（アプリ向け）
 *
 * web の残数問い合わせ（`peekPracticeQuota`）と同じ規則（`peekUserQuota`）。
 * 盤面に戻ってきたとき・購入の後に、残数と特典の表示を取り直すのに使う。
 * 販売中かの判定は {@link handleBeginPracticeQuota} と同じく、要求の OS を読まず
 * App Store か Google Play のどちらかで販売中か（{@link isProOnSaleInApp}）。
 * DB の失敗は 500（止める・通すの判断が要らない。アプリは直前の表示を保つ）。
 *
 * クエリの `menu` が回数制限の対象の練習でなければ 400 `invalidRequest`。
 */
export async function handlePeekPracticeQuota(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "mobilePeekPracticeQuota");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobileUsernameRequired();
  const menu = quotaMenuOf(new URL(request.url).searchParams.get("menu"));
  if (menu === undefined) return mobileInvalidRequest();
  try {
    return mobileQuotaResponseOf(
      await peekUserQuota(auth.user.id, menu, new Date(), isProOnSaleInApp()),
    );
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/practice-quota",
      "残数の読み取りに失敗",
      error,
    );
  }
}

/** クエリの値を回数制限の対象の練習に絞る */
function quotaMenuOf(value: string | null): QuotaMenu | undefined {
  return value !== null && isQuotaMenu(value) ? value : undefined;
}
