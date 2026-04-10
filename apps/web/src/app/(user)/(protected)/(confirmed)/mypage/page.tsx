/**
 * マイページトップ
 *
 * @description ログインユーザー専用のトップページ。EXP アクティビティヒートマップと
 *   各機能へのカードリンクを配置する。
 * @flow マイページ閲覧 → ヒートマップで日次アクティビティを確認 → マイレコードへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { getAuthenticatedUser } from "@/lib/auth";
import { getExpHeatmapData } from "@/lib/db/get-exp-heatmap-data";

import { ExpActivityHeatmap } from "./_components/exp-activity-heatmap";
import { DESKTOP_WEEKS, buildHeatmapLayout } from "./_lib/heatmap-utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mypage");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function MyPage() {
  const t = await getTranslations("mypage");
  const tHeatmap = await getTranslations("mypageHeatmap");
  const user = await getAuthenticatedUser();
  const heatmapData = await getExpHeatmapData(user.id);

  // SSR 時点で JST 基準のレイアウトを確定させ、クライアントの `new Date()` による
  // ハイドレーションミスマッチを防ぐ。
  const heatmapLayout = buildHeatmapLayout({
    now: new Date(),
    daily: heatmapData.daily,
    monthNames: tHeatmap.raw("monthNames") as string[],
    recentDaysCount: 7,
    totalWeeks: DESKTOP_WEEKS,
  });

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

      <section className="mt-6 rounded-lg border border-surface-200 bg-surface-50 p-5">
        <SectionTitle>{t("activityTitle")}</SectionTitle>
        <div className="mt-4">
          <ExpActivityHeatmap data={heatmapData} layout={heatmapLayout} />
        </div>
      </section>

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
