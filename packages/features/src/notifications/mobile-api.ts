import { z } from "zod";

import type { NotificationMessageMetadata } from "./message";

/**
 * アプリ向けの通知の API の契約（パス・要求・応答）
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ユーザー名を決める前は 409 `usernameRequired`（マイページと同じ。理由の
 * 判定は `mypage/mobile-api.ts` の `isMobileMypageErrorCode`）— web も通知の
 * ページをユーザー名を決めた人にしか開かせない。
 *
 * 通知の文面は応答に載せない。種別と差し込み値（metadata）だけを返し、
 * アプリは web と同じ `message.ts` で辞書のキーを決める。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * 通知の一覧を返す API のパス（GET。`?page=` で 1 始まりのページ。要ログイン）
 * 通知一覧APIパス
 */
export const MOBILE_NOTIFICATIONS_API_PATH = `${MOBILE_API_PREFIX}/notifications`;

/**
 * 通知を既読にする API のパス（POST。要ログイン）
 * 通知既読化APIパス
 *
 * 本文は {@link MobileNotificationsReadRequest}。
 */
export const MOBILE_NOTIFICATIONS_READ_API_PATH = `${MOBILE_NOTIFICATIONS_API_PATH}/read`;

/**
 * 通知の一覧の API の URL（パス + クエリ）
 * 通知一覧API URL
 *
 * @param page - 1 始まりのページ番号
 */
export function mobileNotificationsApiUrl(page: number): string {
  return `${MOBILE_NOTIFICATIONS_API_PATH}?page=${page}`;
}

/**
 * 通知 1 件
 * 通知一覧項目
 *
 * `type` は DB の値のまま（退役した種別が残り得るので union に絞らない。
 * 文面は `buildNotificationMessage` が汎用の文面に落とす）。
 */
export interface MobileNotification {
  readonly id: string;
  readonly type: string;
  /** 文面に差し込む値 */
  readonly metadata: NotificationMessageMetadata;
  /** 既読にした日時（ISO 8601）。未読なら無い */
  readonly readAt?: string;
  /** 届いた日時（ISO 8601） */
  readonly createdAt: string;
}

/**
 * 通知の一覧の 1 ページ
 * 通知一覧応答
 *
 * 並びは web の通知ページと同じ（新しい順）、1 ページの件数も同じ。
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileNotificationsResponse {
  readonly items: readonly MobileNotification[];
  /** 返したページ番号（範囲外を要求したら最後のページに丸める） */
  readonly page: number;
  /** 総ページ数。通知が無くても 1 */
  readonly totalPages: number;
  /** 未読の件数（全ページ） */
  readonly unreadCount: number;
}

/**
 * 既読化の要求
 * 通知既読化要求
 *
 * - `{ id }` — その 1 件を既読にする（行を押したとき）
 * - `{ all: true }` — 未読をすべて既読にする（「すべて既読にする」）
 *
 * 他人の通知・既読の通知の id を送っても何も起きず、成功を返す（web と同じ）。
 */
export type MobileNotificationsReadRequest =
  { readonly id: string } | { readonly all: true };

const isoDateTime = z.iso.datetime({ offset: true });

const notificationsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      metadata: z.object({
        kind: z.string().optional(),
        expiresAt: z.string().optional(),
        revokeReason: z.string().optional(),
      }),
      readAt: isoDateTime.optional(),
      createdAt: isoDateTime,
    }),
  ),
  page: z.number(),
  totalPages: z.number(),
  unreadCount: z.number(),
});

/**
 * 通知の一覧の応答を検証する。形が違えば undefined
 * 通知一覧応答検証
 */
export function parseMobileNotificationsResponse(
  body: unknown,
): MobileNotificationsResponse | undefined {
  const parsed = notificationsSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}
