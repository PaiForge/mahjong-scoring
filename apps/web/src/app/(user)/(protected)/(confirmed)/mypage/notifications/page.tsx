/**
 * 通知
 *
 * @description ログインユーザー本人に届いた通知の一覧。Pro プランの出来事
 *   （購入完了・期限切れ・運営からの付与・取り消し）が新しい順に並ぶ。
 *   未読は太字 + 緑の点。ヘッダーのベル（`NotificationBell`）がここへ送る。
 * @flow ベル / マイページの「通知」 → 一覧 → 行を押す（既読になり、
 *   プラン状況へ） / 「すべて既読にする」 → ページ送り（`?page=`）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PaginationNav } from "@/app/(user)/_components/pagination-nav";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { parsePageParam } from "@/lib/pagination";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/notifications/queries";

import { MarkAllReadButton } from "./_components/mark-all-read-button";
import { NotificationItem } from "./_components/notification-item";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("notifications");
}

interface NotificationsPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const { user } = await requireConfirmedUser();
  const params = await searchParams;
  const page = parsePageParam(params.page);

  const [t, tMypage, { items, totalPages, currentPage }, unreadCount] =
    await Promise.all([
      getTranslations("notifications"),
      getTranslations("mypage"),
      listNotifications(user.id, page),
      countUnreadNotifications(user.id),
    ]);

  const buildHref = (p: number) =>
    p > 1 ? `/mypage/notifications?page=${p}` : "/mypage/notifications";

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-4">
        {/* 未読数とボタンの行。未読が無くても高さを保ち、既読にした瞬間に
            一覧が上へ飛ばないようにする */}
        <div className="flex min-h-9 items-center justify-between gap-4">
          <p className="text-sm text-surface-600">
            {unreadCount > 0 ? t("unreadCount", { count: unreadCount }) : ""}
          </p>
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {items.length === 0 ? (
          <div className="space-y-2 py-8 text-center">
            <p className="text-sm font-bold text-foreground">{t("empty")}</p>
            <p className="text-xs leading-relaxed text-surface-500">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <LinkRowList>
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </LinkRowList>
        )}

        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
        />
      </div>
    </ContentContainer>
  );
}
