"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localizedHref } from "@/i18n/public-path";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
  TEXT_LINK_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import {
  ROW_INNER_CLASSES,
  ROW_ITEM_CLASSES,
} from "@/app/[locale]/(user)/_components/link-row";
import type { NotificationListItem } from "@/lib/notifications/queries";
import { dispatchNotificationsRead } from "@/lib/notifications/read-event";
import { formatJstDateTime } from "@mahjong-scoring/features/jst";

import { markNotificationReadAction } from "../_actions/mark-read";
import { notificationHref } from "@mahjong-scoring/features/notifications/link";
import {
  buildNotificationDetail,
  buildNotificationMessage,
} from "@mahjong-scoring/features/notifications/message";
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
 *
 * 本文を持つ通知（運営が本文を書いた付与。`buildNotificationDetail`）は、押しても
 * 遷移せずにその場で開き、本文・期間・遷移先へのリンクを出す。開いたときに既読に
 * する。本文は運営の文なので改行をそのまま出す。
 *
 * 文面・日時・遷移先はページの言語で出す。遷移先（`notificationHref`）は
 * どれもマイページの下位（いまはプラン状況だけ）で、通知の一覧を出している
 * 言語では出しているので、ここでは公開状態を読まずに同じ言語の href にする
 * （`localizedHref`。日本語は恒等）。英語で出していない行き先を足すと、
 * `mypage-link-targets.test.ts` が落ちる。日時の時刻は言語によらず JST。
 */
export function NotificationItem({ notification }: NotificationItemProps) {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const isUnread = notification.readAt === undefined;
  const destination = notificationHref(notification.type);
  const href =
    destination === undefined ? undefined : localizedHref(destination, locale);
  const message = buildNotificationMessage(
    notification.type,
    notification.metadata,
    locale,
  );
  const detail = buildNotificationDetail(
    notification.type,
    notification.metadata,
    locale,
  );
  const [expanded, setExpanded] = useState(false);

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
          {formatJstDateTime(notification.createdAt, locale)}
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

  if (detail) {
    const panelId = `notification-detail-${notification.id}`;
    return (
      <li className={ROW_ITEM_CLASSES}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => {
            if (!expanded) handleClick();
            setExpanded(!expanded);
          }}
          className={`group w-full cursor-pointer items-start text-left transition-colors hover:bg-surface-50 ${ROW_INNER_CLASSES} ${FOCUS_RING_CLASSES}`}
        >
          {body}
          <span className="flex min-h-5 shrink-0 items-center text-surface-400">
            <ChevronRightIcon
              className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </span>
        </button>
        {expanded && (
          <div id={panelId} className={`${ROW_INNER_CLASSES} pt-0!`}>
            {/* 本文の左端を文面にそろえる（行頭のアイコンの幅） */}
            <span aria-hidden="true" className="w-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <p className="leading-relaxed whitespace-pre-wrap break-words">
                {detail.body}
              </p>
              <p className="text-surface-600">
                {t(`detail.${detail.period.key}`, detail.period.values)}
              </p>
              {href && (
                <Link href={href} className={TEXT_LINK_CLASSES}>
                  {t("detail.viewPlan")}
                </Link>
              )}
            </div>
          </div>
        )}
      </li>
    );
  }

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
