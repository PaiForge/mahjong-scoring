/**
 * お知らせ一覧
 *
 * @description
 * 公開済みお知らせの一覧ページ。日本語は slug ごとに best なロケール variant を
 * 1 件表示する。英語は英語で書いて公開した行だけを出し、件数もその行だけを
 * 数える（日本語の行で埋めない）。
 *
 * @design 英語は fallback 無し・noindex・動的のまま
 * 英語の一覧は英訳の行だけで組み（`listAnnouncementsFor` /
 * `countAnnouncementsFor`）、robots は公開状態の表（`published-noindex`）から
 * 引く（`withAnnouncementRobots`。日本語の metadata は変えない）。索引対象は
 * 静的生成が規約で、静的にするにはページ送り（`?page=`）をパスに移す変更が
 * 要る。英訳のお知らせはまだ無く検索の受け皿にもならないので、日本語の
 * 動的 / 静的の分類を変えない noindex を採った（理由の全文は
 * `_lib/announcement-locale.ts` の TSDoc）。ページ送りは同じ言語の一覧を指し
 * （英語は `/en/announcements?page=2`）、広告は英語では出さない
 * （`getNativeAdCreative` に言語を渡す）。
 *
 * 行の詳細リンクは、日本語では `AnnouncementTextList` の既定（素の
 * `/announcements/<slug>`）のまま。英語では `detailLink` に
 * `resolveNavTargetFor` を渡して `/en/announcements/<slug>`（同じ言語の
 * `next/link`）へ張る — 既定の張り方はロケール非依存のパスをそのまま使うので、
 * 英語の一覧からだと日本語の詳細へ飛んでしまう。
 *
 * @flow ナビ「お知らせ」→ 一覧 → 各お知らせの詳細（/announcements/[slug]）
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ANNOUNCEMENTS_PER_PAGE } from "@mahjong-scoring/features/announcements/listing";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { NativeAdRow } from "@/app/[locale]/(user)/_components/native-ad-row";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { PaginationNav } from "@/app/[locale]/(user)/_components/pagination-nav";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import { parsePageParam, resolvePagination } from "@/lib/pagination";

import {
  type AnnouncementDetailLink,
  AnnouncementTextList,
} from "./_components/announcement-text-list";
import {
  announcementsPageHref,
  countAnnouncementsFor,
  listAnnouncementsFor,
  withAnnouncementRobots,
} from "./_lib/announcement-locale";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

export const revalidate = 86400;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/announcements">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/announcements");
  const metadata = await createNamespaceMetadata("announcements", {
    title: "pageTitle",
    description: "pageDescription",
    path: ANNOUNCEMENTS_PATH,
    locale,
  });
  return withAnnouncementRobots(metadata, ANNOUNCEMENTS_PATH, locale);
}

/**
 * 行の詳細リンクの張り方
 *
 * 日本語は undefined（`AnnouncementTextList` の既定。行のリンクの出力を
 * 変えない）。それ以外の言語は同じ言語の詳細（`/en/announcements/<slug>`）へ
 * 張る。英語の詳細はテンプレートで公開済みなので `crossLocale` は立たず、
 * 「日本語のみ」の印も付かない（ラベルは型が求めるので渡しておく）。
 */
async function detailLinkFor(
  locale: SupportedLocale,
): Promise<AnnouncementDetailLink | undefined> {
  if (locale === DEFAULT_LOCALE) return undefined;
  const tNav = await getTranslations("nav");
  return {
    targetFor: (path) => resolveNavTargetFor(path, locale),
    japaneseOnlyLabel: tNav("language.japaneseOnly"),
  };
}

export default async function AnnouncementsPage({
  params,
  searchParams,
}: Props & Pick<PageProps<"/[locale]/announcements">, "params">) {
  const locale = await prepareRouteLocale(params, "/announcements");
  const { page } = await searchParams;
  const t = await getTranslations("announcements");

  const requestedPage = parsePageParam(page);
  const totalCount = await countAnnouncementsFor(locale);
  const { currentPage, totalPages, limit, offset } = resolvePagination(
    requestedPage,
    totalCount,
    ANNOUNCEMENTS_PER_PAGE,
  );

  // 範囲外のページは最終ページを出さず 404 にする（丸めたページと要求の
  // 食い違いで判定する。アプリ向け API は丸めたページをそのまま返す）
  if (currentPage !== requestedPage) {
    notFound();
  }

  const [items, ad, detailLink] = await Promise.all([
    listAnnouncementsFor(locale, limit, offset),
    getNativeAdCreative("announcements-index-native-ad", locale),
    detailLinkFor(locale),
  ]);

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-4">
        <SectionTitle>{t("listTitle")}</SectionTitle>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="space-y-6">
            <AnnouncementTextList
              announcements={items}
              locale={locale}
              pinnedLabel={t("pinned")}
              trailingAd={ad && <NativeAdRow creative={ad} />}
              detailLink={detailLink}
            />
            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => announcementsPageHref(p, locale)}
            />
          </div>
        )}
      </div>
    </ContentContainer>
  );
}
