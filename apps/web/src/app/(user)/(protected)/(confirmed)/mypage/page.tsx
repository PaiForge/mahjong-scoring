/**
 * マイページトップ
 *
 * @description ログインユーザー専用のトップページ。各機能へのカードリンクを配置する。
 * @flow マイページ閲覧 → マイレコードへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mypage");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function MyPage() {
  const t = await getTranslations("mypage");

  const cards = [
    {
      href: "/mypage/challenges",
      icon: "\uD83D\uDCCA",
      title: t("cards.challenges.title"),
      summary: t("cards.challenges.summary"),
    },
  ];

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block rounded-lg border border-surface-200 bg-surface-50 p-5 transition-colors hover:bg-surface-100"
          >
            <span className="text-2xl">{card.icon}</span>
            <h2 className="mt-2 text-base font-semibold text-surface-900">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-surface-500">{card.summary}</p>
          </Link>
        ))}
      </div>
    </ContentContainer>
  );
}
