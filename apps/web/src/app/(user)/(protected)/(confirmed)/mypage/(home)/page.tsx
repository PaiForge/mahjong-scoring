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
import { UserAvatar } from "@/app/_components/user-avatar";
import { createMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileCardByUserId } from "@/lib/db/queries";
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
  const tHeatmap = await getTranslations("mypage.heatmap");
  const { user } = await requireConfirmedUser();
  const [profile, heatmapData] = await Promise.all([
    getProfileCardByUserId(user.id),
    getExpHeatmapData(user.id),
  ]);
  const profileName = profile?.displayName ?? profile?.username ?? "";

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
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-6">
        <section className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <UserAvatar
            avatarUrl={profile?.avatarUrl ?? null}
            name={profileName || t("pageTitle")}
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {profileName || t("pageTitle")}
            </h2>
            {profile?.username && (
              <p className="text-sm text-surface-500">@{profile.username}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {profile?.username && (
                <Link
                  href={`/u/${profile.username}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-100"
                >
                  <span aria-hidden="true">👤</span>
                  <span>{t("viewProfile")}</span>
                </Link>
              )}
              <Link
                href="/mypage/profile/edit"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-100"
              >
                <span aria-hidden="true">✏️</span>
                <span>{t("editProfile")}</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            <span className="mr-1">🔥</span>
            {t("activityTitle")}
          </h2>
          <ExpActivityHeatmap data={heatmapData} layout={heatmapLayout} />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group block rounded-md border border-border bg-card p-6 transition-all hover:border-foreground/20"
            >
              <span className="text-2xl">{card.icon}</span>
              <h2 className="mt-2 text-base font-semibold text-foreground">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {card.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </ContentContainer>
  );
}
