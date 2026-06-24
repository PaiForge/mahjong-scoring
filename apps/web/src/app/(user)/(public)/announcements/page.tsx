/**
 * お知らせ一覧
 *
 * @description
 * 公開済みお知らせの一覧ページ。slug ごとに best なロケール variant を 1 件表示する。
 * @flow ナビ「お知らせ」→ 一覧 → 各お知らせの詳細（/announcements/[slug]）
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { ListLink, ListLinkContainer } from "@/app/_components/list-link";
import { PageTitle } from "@/app/_components/page-title";
import { PaginationNav } from "@/app/_components/pagination-nav";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";

import {
  getPublishedAnnouncementCount,
  getPublishedAnnouncementsPaginated,
} from "./_lib/queries";

export const revalidate = 86400;

const ANNOUNCEMENTS_PER_PAGE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("announcements");
  return createMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function AnnouncementsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("announcements");

  const currentPage = Math.max(1, Number(page) || 1);
  const totalCount = await getPublishedAnnouncementCount();
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / ANNOUNCEMENTS_PER_PAGE),
  );

  if (currentPage > totalPages && totalPages > 0 && page !== undefined) {
    notFound();
  }

  const offset = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;
  const items = await getPublishedAnnouncementsPaginated(
    locale,
    ANNOUNCEMENTS_PER_PAGE,
    offset,
  );

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-4">
        <SectionTitle>{t("listTitle")}</SectionTitle>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="space-y-6">
            <ListLinkContainer>
              {items.map((announcement) => {
                const publishedDate = announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleDateString(
                      locale,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : undefined;

                return (
                  <ListLink
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    icon="📢"
                    title={announcement.title}
                    meta={publishedDate}
                    badge={
                      announcement.pinnedAt !== null ? (
                        <span className="flex-shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                          {t("pinned")}
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </ListLinkContainer>
            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => `/announcements${p > 1 ? `?page=${p}` : ""}`}
            />
          </div>
        )}
      </div>
    </ContentContainer>
  );
}
