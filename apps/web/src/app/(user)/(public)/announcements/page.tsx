/**
 * お知らせ一覧
 *
 * @description
 * 公開済みお知らせの一覧ページ。slug ごとに best なロケール variant を 1 件表示する。
 * @flow ナビ「お知らせ」→ 一覧 → 各お知らせの詳細（/announcements/[slug]）
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
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
  const totalPages = Math.max(1, Math.ceil(totalCount / ANNOUNCEMENTS_PER_PAGE));

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
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("pageDescription")}</p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-surface-500">{t("empty")}</p>
      ) : (
        <div className="mt-8">
          <SectionTitle>{t("listTitle")}</SectionTitle>
          <ul className="mt-4 divide-y divide-surface-200 border-y border-surface-200">
            {items.map((announcement) => {
              const publishedDate = announcement.publishedAt
                ? new Date(announcement.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : undefined;

              return (
                <li key={announcement.id}>
                  <Link
                    href={`/announcements/${announcement.slug}`}
                    className="flex items-center justify-between gap-4 px-1 py-4 transition-colors hover:bg-surface-50"
                  >
                    <span className="flex items-center gap-2 font-medium text-surface-900">
                      {announcement.pinnedAt !== null && (
                        <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                          {t("pinned")}
                        </span>
                      )}
                      {announcement.title}
                    </span>
                    {publishedDate && (
                      <span className="shrink-0 text-sm text-surface-400">{publishedDate}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => `/announcements${p > 1 ? `?page=${p}` : ""}`}
            />
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
