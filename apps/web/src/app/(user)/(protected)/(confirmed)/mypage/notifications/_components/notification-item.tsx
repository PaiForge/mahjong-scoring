"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import {
  ROW_INNER_CLASSES,
  ROW_ITEM_CLASSES,
} from "@/app/(user)/_components/link-row";
import type { NotificationListItem } from "@/lib/notifications/queries";
import { dispatchNotificationsRead } from "@/lib/notifications/read-event";
import { formatJstDateTime } from "@mahjong-scoring/features/jst";

import { markNotificationReadAction } from "../_actions/mark-read";
import { notificationHref } from "../_lib/notification-link";
import { buildNotificationMessage } from "../_lib/notification-message";
import { NotificationTypeIcon } from "./notification-type-icon";

interface NotificationItemProps {
  readonly notification: NotificationListItem;
}

/**
 * 通知 1 行
 * 通知行
 *
 * 構造は `LinkRow` と同じ「先頭の視覚要素 + 本文 + 行末」。本文（文面）が
 * 行のタイトルで、下に日時。未読は行末に緑の点を置き、文面を太字にする。
 *
 * 押すと遷移先へ行き、同時に既読にする（Server Action は待たない — 遷移を
 * 止めないため。失敗しても一覧を開き直せば未読のまま残っているだけ）。既読に
 * したらベルに知らせる（`dispatchNotificationsRead`）。
 *
 * 遷移先を持たない種別（退役した種別）は押せない行として出す。
 */
export function NotificationItem({ notification }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const isUnread = notification.readAt === undefined;
  const href = notificationHref(notification.type);
  const message = buildNotificationMessage(
    notification.type,
    notification.metadata,
  );

  function handleClick() {
    if (!isUnread) return;
    void markNotificationReadAction(notification.id).then((result) => {
      if ("success" in result) dispatchNotificationsRead();
    });
  }

  const body = (
    <>
      <span className="flex min-h-5 shrink-0 items-center">
        <NotificationTypeIcon type={notification.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm ${isUnread ? "font-bold" : "font-medium"} ${href ? ROW_LINK_TITLE_CLASSES : "text-foreground"}`}
        >
          {t(`messages.${message.key}`, message.values)}
        </span>
        <span className="mt-0.5 block text-xs tabular-nums text-surface-400">
          {/* 相対表記（「3 日前」）にしない。サーバーで描いた文字列をそのまま
              出すので、クライアントの時計とのずれでハイドレーションが崩れない */}
          {formatJstDateTime(notification.createdAt)}
        </span>
      </span>
      {isUnread && (
        <span className="flex min-h-5 shrink-0 items-center">
          <span
            role="img"
            aria-label={t("unread")}
            className="block size-2.5 rounded-full bg-action"
          />
        </span>
      )}
    </>
  );

  return (
    <li className={ROW_ITEM_CLASSES}>
      {href ? (
        <Link
          href={href}
          onClick={handleClick}
          className={`group items-start transition-colors hover:bg-surface-50 ${ROW_INNER_CLASSES} ${FOCUS_RING_CLASSES}`}
        >
          {body}
        </Link>
      ) : (
        <div className={`items-start ${ROW_INNER_CLASSES}`}>{body}</div>
      )}
    </li>
  );
}
