import { useSyncExternalStore } from "react";
import type {
  MobileNotification,
  MobileNotificationsResponse,
} from "@mahjong-scoring/features/notifications/mobile-api";
import { NotificationType } from "@mahjong-scoring/features/notifications/types";

/**
 * 未読の通知の要約（ホームのアバターのバッジと付与の告知カードの材料）
 * 未読通知要約
 *
 * @property userId - この要約を読んだユーザー。別のユーザーの値を出さないために持つ
 * @property unreadCount - 未読の件数（全ページ）
 * @property unreadGrant - 未読の「運営から Pro が付与された」通知のうち最も新しいもの。
 *   通知の 1 ページ目（新しい順）にあるものだけを見る
 */
export interface UnreadNotificationsSummary {
  readonly userId: string;
  readonly unreadCount: number;
  readonly unreadGrant?: MobileNotification;
}

/**
 * 通知の一覧の 1 ページ目から要約を作る
 * 未読通知要約作成
 *
 * `readLocally` はこの端末で既読にしたが、サーバーの応答にまだ未読で載っている
 * 通知の id。既読化の通信は待たずに遷移するので、戻った画面の読み直しが先に
 * 着くことがある。その行は未読に数えず、件数からも引く（件数は全ページの値なので、
 * 引けるのは 1 ページ目に載っている分だけ）。
 */
export function summarizeUnreadNotifications(
  userId: string,
  firstPage: Pick<MobileNotificationsResponse, "items" | "unreadCount">,
  readLocally: ReadonlySet<string>,
): UnreadNotificationsSummary {
  const unread = firstPage.items.filter(
    (item) => item.readAt === undefined && !readLocally.has(item.id),
  );
  const staleCount = firstPage.items.filter(
    (item) => item.readAt === undefined && readLocally.has(item.id),
  ).length;
  const unreadGrant = unread.find(
    (item) => item.type === NotificationType.BenefitGranted,
  );
  return {
    userId,
    unreadCount: Math.max(0, firstPage.unreadCount - staleCount),
    ...(unreadGrant === undefined ? {} : { unreadGrant }),
  };
}

/**
 * 1 件を既読にした後の要約
 * 未読通知要約の既読反映
 *
 * 告知カードがその通知なら消す。件数は 1 減らす（0 未満にしない）。
 */
export function withNotificationRead(
  summary: UnreadNotificationsSummary,
  id: string,
): UnreadNotificationsSummary {
  const { unreadGrant, ...rest } = summary;
  return {
    ...rest,
    unreadCount: Math.max(0, summary.unreadCount - 1),
    ...(unreadGrant === undefined || unreadGrant.id === id
      ? {}
      : { unreadGrant }),
  };
}

let current: UnreadNotificationsSummary | undefined;
/** この端末で既読にした通知の id（ユーザーごと。読み直しの追い越し対策） */
const readLocallyByUser = new Map<string, Set<string>>();
const listeners = new Set<() => void>();

function publish(next: UnreadNotificationsSummary | undefined): void {
  current = next;
  for (const listener of listeners) listener();
}

function readLocallyOf(userId: string): Set<string> {
  let ids = readLocallyByUser.get(userId);
  if (ids === undefined) {
    ids = new Set();
    readLocallyByUser.set(userId, ids);
  }
  return ids;
}

/**
 * 通知の 1 ページ目を読んだ結果を載せる
 * 未読通知の反映
 *
 * ホームとマイページの通知の画面が読むたびに呼ぶ。サーバーが既読と返した id は
 * 端末の「既読にした」から外す（もう追い越しは起きない）。
 */
export function publishUnreadNotifications(
  userId: string,
  firstPage: Pick<MobileNotificationsResponse, "items" | "unreadCount">,
): void {
  const readLocally = readLocallyOf(userId);
  for (const item of firstPage.items) {
    if (item.readAt !== undefined) readLocally.delete(item.id);
  }
  publish(summarizeUnreadNotifications(userId, firstPage, readLocally));
}

/**
 * 未読の件数だけを載せる（マイページの応答は件数しか持たない）
 * 未読件数の反映
 *
 * 告知カードの材料は件数からは作れないので、同じユーザーの前の値を残す。
 * 件数が 0 なら未読の付与も無い。
 */
export function publishUnreadNotificationCount(
  userId: string,
  unreadCount: number,
): void {
  const previous = current?.userId === userId ? current : undefined;
  publish({
    userId,
    unreadCount,
    ...(unreadCount === 0 || previous?.unreadGrant === undefined
      ? {}
      : { unreadGrant: previous.unreadGrant }),
  });
}

/**
 * この端末で 1 件を既読にしたことを載せる（既読化の通信の前に呼ぶ）
 * 通知既読の反映
 */
export function noteNotificationRead(userId: string, id: string): void {
  readLocallyOf(userId).add(id);
  if (current?.userId === userId) publish(withNotificationRead(current, id));
}

/**
 * すべて既読にしたことを載せる（サーバーが成功を返した後に呼ぶ）
 * 全件既読の反映
 */
export function noteAllNotificationsRead(userId: string): void {
  publish({ userId, unreadCount: 0 });
}

/**
 * 指定したユーザーの未読の要約（いまの値）。まだ読んでいない・別のユーザーの値
 * しか無いときは undefined
 * 未読通知要約の取得
 */
export function getUnreadNotifications(
  userId: string | undefined,
): UnreadNotificationsSummary | undefined {
  return userId !== undefined && current?.userId === userId
    ? current
    : undefined;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * 指定したユーザーの未読の要約を購読する。まだ読んでいない・別のユーザーの値
 * しか無いときは undefined
 * 未読通知要約の購読
 *
 * ホームのヘッダーのアバターはナビゲーターが画面の外で描き、画面の中の Context が
 * 届かないので、モジュールのストアから読む。
 */
export function useUnreadNotifications(
  userId: string | undefined,
): UnreadNotificationsSummary | undefined {
  return useSyncExternalStore(subscribe, () => getUnreadNotifications(userId));
}
