/**
 * お知らせ詳細
 *
 * @description
 * 公開済みお知らせ 1 件の詳細。本文は Markdown としてレンダリングする。
 *
 * @design 英語は英語の行が無ければ 404（日本語へ fallback しない）
 * 日本語は従来どおり fallback 付き（要求言語 → 日本語 → その他の variant）。
 * 英語は英語で書いて公開した行だけを引き（`findAnnouncementFor`）、無い slug は
 * 日本語の行が公開されていても 404 にする — 英語の画面に日本語の本文を
 * 出さないため。英語は公開状態の表で `published-noindex`（DB 由来の slug は
 * ビルド時に列挙しないので、静的生成が要る索引対象にはしない。理由の全文は
 * `../_lib/announcement-locale.ts` の TSDoc）で、robots はその表から引く
 * （`withAnnouncementRobots`。日本語の metadata は変えない）。
 *
 * パンくずの一覧（`/announcements`）はロケール非依存のパスのまま渡す。
 * `Breadcrumb` が表示中の言語で公開状態を引いて `/en/announcements` に
 * 解決する（言語付きのパスを渡すと公開状態の表に当たらず、リンクが消える）。
 *
 * 祖先に loading.tsx があるので `notFound()` は 200 のソフト 404 になるが、
 * Next が not-found の描画に noindex を入れるため索引はされない。
 *
 * @flow 一覧（/announcements）→ 詳細
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { MarkdownRenderer } from "@/app/[locale]/(user)/_components/markdown-renderer";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import {
  ANNOUNCEMENT_DETAIL_DATE_OPTIONS,
  formatPublishedDate,
} from "@mahjong-scoring/features/announcements/format";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

import {
  findAnnouncementFor,
  withAnnouncementRobots,
} from "../_lib/announcement-locale";

export const revalidate = 86400;

interface Props {
  readonly params: Promise<{ readonly locale: string; readonly slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = `${ANNOUNCEMENTS_PATH}/${slug}`;
  const locale = await prepareRouteLocale(params, path);
  const announcement = await findAnnouncementFor(slug, locale);

  if (!announcement) {
    const t = await getTranslations({ locale, namespace: "announcements" });
    return createMetadata({ title: t("notFound"), locale });
  }

  const description = announcement.content
    .slice(0, 160)
    .replace(/\n/g, " ")
    .trim();
  return withAnnouncementRobots(
    createMetadata({
      title: announcement.title,
      description,
      path,
      locale,
    }),
    path,
    locale,
  );
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await prepareRouteLocale(
    params,
    `${ANNOUNCEMENTS_PATH}/${slug}`,
  );
  const t = await getTranslations({ locale, namespace: "announcements" });

  const announcement = await findAnnouncementFor(slug, locale);

  if (!announcement) {
    notFound();
  }

  const publishedDate = formatPublishedDate(
    announcement.publishedAt,
    locale,
    ANNOUNCEMENT_DETAIL_DATE_OPTIONS,
  );

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("pageTitle"), href: ANNOUNCEMENTS_PATH },
        { label: announcement.title },
      ]}
    >
      <PageTitle>{announcement.title}</PageTitle>

      <div className="space-y-8">
        <article>
          <MarkdownRenderer content={announcement.content} skipFirstH1 />
        </article>

        {publishedDate && (
          <p className="text-right text-sm text-muted-foreground">
            {publishedDate}
          </p>
        )}
      </div>
    </ContentContainer>
  );
}
