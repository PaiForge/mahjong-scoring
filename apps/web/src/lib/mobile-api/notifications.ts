import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileNotification,
  MobileNotificationsReadRequest,
  MobileNotificationsResponse,
} from "@mahjong-scoring/features/notifications/mobile-api";

import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListItem,
} from "../notifications/queries";
import { parsePageParam } from "../pagination";

import { authorizeMobileRequest } from "./auth";
import { usernameRequired } from "./mypage";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

/** 既読化の本文の上限。UUID 1 つの `{"id":"…"}` が収まれば足りる */
const READ_BODY_MAX_BYTES = 256;

const readBodySchema: z.ZodType<MobileNotificationsReadRequest> = z.union([
  z.object({ id: z.uuid() }),
  z.object({ all: z.literal(true) }),
]);

/**
 * 一覧の 1 行を応答の形に写す（日時は ISO 8601）
 *
 * metadata は文面に使う値だけを載せる（プランの名前は文面に出さない）。
 */
function mobileNotificationOf(item: NotificationListItem): MobileNotification {
  const { kind, expiresAt, revokeReason } = item.metadata;
  return {
    id: item.id,
    type: item.type,
    metadata: {
      ...(kind === undefined ? {} : { kind }),
      ...(expiresAt === undefined ? {} : { expiresAt }),
      ...(revokeReason === undefined ? {} : { revokeReason }),
    },
    ...(item.readAt === undefined ? {} : { readAt: item.readAt.toISOString() }),
    createdAt: item.createdAt.toISOString(),
  };
}

/**
 * 通知の一覧の 1 ページと未読数を返す（アプリ向け）
 * 通知一覧API（アプリ向け）
 *
 * web の通知ページと同じ材料（`listNotifications` / `countUnreadNotifications`）・
 * 同じ並び・同じ件数。範囲外のページは最後のページに丸める（web と同じ）。
 * 読み出しの失敗は web と同じく空のページ・未読 0 に倒れる（通知の画面が
 * 落ちるより良い）。ユーザー名を決める前は 409 `usernameRequired`（web も
 * 通知のページを本登録の人にしか開かせない）。
 */
export async function handleReadNotifications(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileNotifications");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const page = parsePageParam(
    new URL(request.url).searchParams.get("page") ?? undefined,
  );
  try {
    const [{ items, totalPages, currentPage }, unreadCount] = await Promise.all(
      [
        listNotifications(auth.user.id, page),
        countUnreadNotifications(auth.user.id),
      ],
    );
    return mobileJson<MobileNotificationsResponse>({
      items: items.map(mobileNotificationOf),
      page: currentPage,
      totalPages,
      unreadCount,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/notifications",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * 通知を既読にする（アプリ向け）
 * 通知既読化API（アプリ向け）
 *
 * `{ id }` は 1 件（行を押したとき）、`{ all: true }` は未読のすべて
 * （「すべて既読にする」）。web の Server Action と同じ本体を呼び、回数制限の
 * 枠（`markNotificationsRead`）も web と共有する。本人の行しか更新しない
 * （クエリ側がユーザー ID で絞る）ので、他人の id を渡されても何も起きない。
 */
export async function handleMarkNotificationsRead(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "markNotificationsRead");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const body = await parseMobileBody(
    request,
    readBodySchema,
    READ_BODY_MAX_BYTES,
  );
  if (!body.ok) return body.response;
  try {
    if ("id" in body.data) {
      await markNotificationRead(auth.user.id, body.data.id);
    } else {
      await markAllNotificationsRead(auth.user.id);
    }
    return mobileJson({ success: true });
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/notifications/read",
      "既読化に失敗",
      error,
    );
  }
}
