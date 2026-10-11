import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type { MobilePracticeQuotaResponse } from "@mahjong-scoring/features/billing/mobile-api";
import {
  isQuotaMenu,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import { isAppleIapOnSale } from "../billing/apple/env";
import type { BeginPracticeQuestionResult } from "@mahjong-scoring/features/quota/answer";
import { beginUserQuota, peekUserQuota } from "../practice-quota/user-quota";

import { authorizeMobileRequest } from "./auth";
import { mobilePlanError } from "./plan";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

const BODY_MAX_BYTES = 1024;

const beginSchema = z.object({ menu: z.string() });

/** 回数制限の対象でない練習名への 400（本文の形が違うときと同じ理由） */
function invalidRequest(): NextResponse {
  return mobileJson({ error: "invalidRequest" }, { status: 400 });
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
 * アプリの経路のもの（App Store の Product ID の有無。`isAppleIapOnSale`）で、
 * 販売していない間は無制限で通す — アプリで払う手段が無いペイウォールを出さない。
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
  if (!auth.profile) return mobilePlanError("usernameRequired");
  const body = await parseMobileBody(request, beginSchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;
  const { menu } = body.data;
  if (!isQuotaMenu(menu)) return invalidRequest();
  try {
    return mobileQuotaResponseOf(
      await beginUserQuota(auth.user.id, menu, new Date(), isAppleIapOnSale()),
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
 * 販売中かの判定は {@link handleBeginPracticeQuota} と同じくアプリの経路のもの。
 * DB の失敗は 500（止める・通すの判断が要らない。アプリは直前の表示を保つ）。
 *
 * クエリの `menu` が回数制限の対象の練習でなければ 400 `invalidRequest`。
 */
export async function handlePeekPracticeQuota(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "mobilePeekPracticeQuota");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return mobilePlanError("usernameRequired");
  const menu = quotaMenuOf(new URL(request.url).searchParams.get("menu"));
  if (menu === undefined) return invalidRequest();
  try {
    return mobileQuotaResponseOf(
      await peekUserQuota(auth.user.id, menu, new Date(), isAppleIapOnSale()),
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
