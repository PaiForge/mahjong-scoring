import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileBlocksResponse,
  MobileModerationErrorCode,
} from "@mahjong-scoring/features/moderation/mobile-api";
import { validateReportInput } from "@mahjong-scoring/features/reports/report";

import { blockUser, listBlockedUsers, unblockUser } from "../blocks/blocks";
import { createReport } from "../reports/create-report";

import { authorizeMobileRequest } from "./auth";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

/** 通報の本文の上限（詳細 500 文字の UTF-8 に理由と JSON の枠を足しても収まる） */
const REPORT_BODY_MAX_BYTES = 4096;

/**
 * 通報の本文の形（中身の規則は `validateReportInput` が見る）
 *
 * 型だけをここで揃え、理由の値や詳細の長さは web と同じ関数で検証して 422 で返す
 * （形が違うだけの 400 と、入力の誤りの 422 を分ける）。
 */
const reportBodySchema = z.object({
  reason: z.string(),
  detail: z.string().optional(),
});

/** ブロック・通報の固有の失敗 */
function moderationError(
  error: MobileModerationErrorCode,
  status: number,
): NextResponse {
  return mobileJson<{ error: MobileModerationErrorCode }>(
    { error },
    { status },
  );
}

/** 認証の後に退会が受け付けられた（入口で弾いたときと同じ答え） */
function accountDeleted(): NextResponse {
  return mobileJson({ error: "deleted" }, { status: 403 });
}

/**
 * 相手をブロックする（アプリ向け）
 * ブロックAPI（アプリ向け）
 *
 * web の `blockUserAction` と同じ本体（`blockUser`）・同じ回数制限。
 *
 * @param username - URL のユーザー名
 */
export async function handleBlockUser(
  request: Request,
  username: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "updateBlocks");
  if (!auth.ok) return auth.response;
  try {
    const result = await blockUser(auth.user.id, username);
    switch (result) {
      case "done":
        return mobileJson({ success: true });
      case "notFound":
        return moderationError("notFound", 404);
      case "self":
        return moderationError("self", 422);
      case "accountClosing":
        return accountDeleted();
    }
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/users/[username]/block",
      "ブロックに失敗",
      error,
    );
  }
}

/**
 * ブロックを解除する（アプリ向け）
 * ブロック解除API（アプリ向け）
 *
 * @param username - URL のユーザー名
 */
export async function handleUnblockUser(
  request: Request,
  username: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "updateBlocks");
  if (!auth.ok) return auth.response;
  try {
    const result = await unblockUser(auth.user.id, username);
    switch (result) {
      case "done":
        return mobileJson({ success: true });
      case "notFound":
        return moderationError("notFound", 404);
      case "self":
        return moderationError("self", 422);
    }
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/users/[username]/unblock",
      "ブロックの解除に失敗",
      error,
    );
  }
}

/**
 * 相手を通報する（アプリ向け）
 * 通報API（アプリ向け）
 *
 * web の `reportUserAction` と同じ検証（`validateReportInput`）・本体（`createReport`。
 * 運営者へのメール込み）・回数制限。
 *
 * @param username - URL のユーザー名
 */
export async function handleReportUser(
  request: Request,
  username: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "reportUser");
  if (!auth.ok) return auth.response;
  const body = await parseMobileBody(
    request,
    reportBodySchema,
    REPORT_BODY_MAX_BYTES,
  );
  if (!body.ok) return body.response;
  const input = validateReportInput(body.data.reason, body.data.detail);
  if (!input.ok) return moderationError(input.error, 422);
  try {
    const result = await createReport(auth.user.id, username, input.value);
    switch (result) {
      case "done":
        return mobileJson({ success: true });
      case "notFound":
        return moderationError("notFound", 404);
      case "self":
        return moderationError("self", 422);
      case "accountClosing":
        return accountDeleted();
    }
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/users/[username]/report",
      "通報に失敗",
      error,
    );
  }
}

/**
 * ブロックした人の一覧を返す（アプリ向け）
 * ブロック一覧API（アプリ向け）
 *
 * web の設定の「ブロックしたユーザー」と同じ材料・同じ並び（新しい順）。
 */
export async function handleReadBlocks(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readBlocks");
  if (!auth.ok) return auth.response;
  try {
    const rows = await listBlockedUsers(auth.user.id);
    return mobileJson<MobileBlocksResponse>({
      items: rows.map((row) => ({
        username: row.username,
        displayName: row.displayName ?? undefined,
        avatarUrl: row.avatarUrl ?? undefined,
      })),
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/blocks",
      "読み取りに失敗",
      error,
    );
  }
}
