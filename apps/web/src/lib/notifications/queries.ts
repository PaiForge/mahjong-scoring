import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";
import "server-only";

import { db, notifications } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";

import {
  parseNotificationMetadata,
  type NotificationMetadata,
} from "./metadata";

/**
 * 通知の読み取りと既読化 — 本人の行だけ
 * 通知クエリ
 *
 * どの関数もユーザー ID を受け取り、その人の行だけを扱う。一覧・未読数・
 * 既読化のすべてが {@link visibleTo} の WHERE を共有するので、将来「この人には
 * 見せない通知」（行為者をブロックしている等）の条件が増えても 1 か所に足せば
 * 一覧とバッジが食い違わない — 開けない通知でベルが点いたままになるのを防ぐ。
 */

/** 一覧の 1 行。`type` は DB の値のまま（退役した種別が残り得るので union に絞らない） */
export interface NotificationListItem {
  readonly id: string;
  readonly type: string;
  readonly metadata: NotificationMetadata;
  /** 既読にした日時。未読なら undefined */
  readonly readAt: Date | undefined;
  readonly createdAt: Date;
}

/** 一覧の 1 ページ */
export interface NotificationPage {
  readonly items: readonly NotificationListItem[];
  readonly totalPages: number;
  readonly currentPage: number;
}

/** 1 ページの件数 */
export const NOTIFICATIONS_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/** この人に見せる通知の条件。一覧・未読数・既読化が共有する */
function visibleTo(userId: string, ...conditions: SQL[]): SQL | undefined {
  return and(eq(notifications.userId, userId), ...conditions);
}

/**
 * 通知の一覧（新しい順・ページ送り）
 * 通知一覧取得
 *
 * 失敗したら空のページ（通知ページが落ちるより良い）。ログは残す。
 */
export async function listNotifications(
  userId: string,
  page: number,
): Promise<NotificationPage> {
  const where = visibleTo(userId);
  try {
    // 件数を先に取ってページを確定してから行を引く。並行して引くと範囲外の
    // ページ（3 件しかないのに `?page=9`）が OFFSET の先の空配列を掴み、
    // 表示だけ 1 ページ目に丸めた「通知なし」になる
    const [countResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(where);
    const totalCount = countResult?.count ?? 0;
    const lastPage = getPaginationData(
      1,
      totalCount,
      NOTIFICATIONS_PAGE_SIZE,
    ).totalPages;
    const { totalPages, currentPage, limit, offset } = getPaginationData(
      Math.min(page, lastPage),
      totalCount,
      NOTIFICATIONS_PAGE_SIZE,
    );
    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        metadata: notifications.metadata,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        metadata: parseNotificationMetadata(row.metadata),
        readAt: row.readAt ?? undefined,
        createdAt: row.createdAt,
      })),
      totalPages,
      currentPage,
    };
  } catch (error) {
    logExternalError(
      "listNotifications",
      "failed to list notifications",
      error,
    );
    return { items: [], totalPages: 1, currentPage: 1 };
  }
}

/**
 * 未読の件数（ヘッダーのベル用）
 * 未読数取得
 *
 * 失敗したら 0（ベルが消えるだけ。通知ページを開けば一覧は改めて引く）。
 */
export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(visibleTo(userId, isNull(notifications.readAt)));
    return result?.count ?? 0;
  } catch (error) {
    logExternalError(
      "countUnreadNotifications",
      "failed to count unread notifications",
      error,
    );
    return 0;
  }
}

/**
 * 1 件を既読にする。他人の行・既読の行は触らない
 * 既読化
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
  now: Date = new Date(),
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      visibleTo(
        userId,
        eq(notifications.id, notificationId),
        isNull(notifications.readAt),
      ),
    );
}

/**
 * 未読をすべて既読にする
 * 全既読化
 */
export async function markAllNotificationsRead(
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(visibleTo(userId, isNull(notifications.readAt)));
}
