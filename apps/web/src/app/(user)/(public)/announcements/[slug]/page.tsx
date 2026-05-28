/**
 * お知らせ詳細
 *
 * @description
 * 公開済みお知らせ 1 件の詳細。本文は Markdown としてレンダリングする。
 * @flow 一覧（/announcements）→ 詳細
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { MarkdownRenderer } from "@/app/_components/markdown-renderer";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { getPublishedAnnouncement } from "../_lib/queries";

export const revalidate = 86400;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const announcement = await getPublishedAnnouncement(slug, locale);

  if (!announcement) {
    const t = await getTranslations("announcements");
    return createMetadata({ title: t("notFound") });
  }

  const description = announcement.content.slice(0, 160).replace(/\n/g, " ").trim();
  return createMetadata({ title: announcement.title, description });
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("announcements");

  const announcement = await getPublishedAnnouncement(slug, locale);

  if (!announcement) {
    notFound();
  }

  const publishedDate = announcement.publishedAt
    ? new Date(announcement.publishedAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  return (
    <ContentContainer>
      <Link
        href="/announcements"
        className="text-sm text-primary-600 hover:text-primary-700"
      >
        ← {t("backToList")}
      </Link>

      <PageTitle className="mt-4">{announcement.title}</PageTitle>
      {publishedDate && (
        <p className="mt-2 text-sm text-surface-400">{publishedDate}</p>
      )}

      <article className="mt-6">
        <MarkdownRenderer content={announcement.content} skipFirstH1 />
      </article>
    </ContentContainer>
  );
}
