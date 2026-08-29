/**
 * マイページトップ
 *
 * @description ログインユーザー専用のトップページ。EXP アクティビティヒートマップと
 *   各機能への行リンクを配置する。
 * @flow マイページ閲覧 → ヒートマップで日次アクティビティを確認 → マイレコードへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { UserAvatar } from "@/app/(user)/_components/user-avatar";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileCardByUserId } from "@/lib/db/queries";
import { getExpHeatmapData } from "@/lib/db/get-exp-heatmap-data";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { beltClass, beltForegroundClass } from "@/lib/ranks/belt-colors";
import { highestRank } from "@/lib/ranks/registry";

import { ExpActivityHeatmap } from "./_components/exp-activity-heatmap";
import { DESKTOP_WEEKS, buildHeatmapLayout } from "./_lib/heatmap-utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypage");
}

export default async function MyPage() {
  const t = await getTranslations("mypage");
  const tHeatmap = await getTranslations("mypage.heatmap");
  const tRanks = await getTranslations("ranks");
  const { user } = await requireConfirmedUser();
  const [profile, heatmapData, rankSlugs] = await Promise.all([
    getProfileCardByUserId(user.id),
    getExpHeatmapData(user.id),
    getUserRankSlugs(user.id),
  ]);
  const profileName = profile?.displayName ?? profile?.username ?? "";
  const currentRank = highestRank(rankSlugs);

  // next-intl の raw() は unknown を返すため、型アサーションではなく
  // 実行時フィルタで文字列配列に絞り込む
  const rawMonthNames: unknown = tHeatmap.raw("monthNames");
  const monthNames = Array.isArray(rawMonthNames)
    ? rawMonthNames.filter((m): m is string => typeof m === "string")
    : [];

  // SSR 時点で JST 基準のレイアウトを確定させ、クライアントの `new Date()` による
  // ハイドレーションミスマッチを防ぐ。
  const heatmapLayout = buildHeatmapLayout({
    now: new Date(),
    daily: heatmapData.daily,
    monthNames,
    recentDaysCount: 7,
    totalWeeks: DESKTOP_WEEKS,
  });

  const links = [
    {
      href: "/mypage/challenges",
      icon: "\uD83D\uDCCA",
      title: t("cards.challenges.title"),
      summary: t("cards.challenges.summary"),
    },
    {
      // \u6BB5\u7D1A\u4F4D\u3092\u6301\u305F\u306A\u3044\u30E6\u30FC\u30B6\u30FC\u306B\u3082\u9053\u5834\u306E\u5B58\u5728\u3092\u77E5\u3089\u305B\u308B\u5C0E\u7DDA
      // \uFF08\u30D8\u30C3\u30C0\u306E\u6BB5\u7D1A\u4F4D\u30D0\u30C3\u30B8\u306F\u53D6\u5F97\u6E08\u307F\u306E\u3068\u304D\u3057\u304B\u51FA\u306A\u3044\uFF09
      href: "/dojo",
      icon: "\uD83C\uDF93",
      title: t("cards.dojo.title"),
      summary: t("cards.dojo.summary"),
    },
  ];

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-6">
        <section className="flex items-center gap-4 rounded-lg border-3 border-ink bg-card p-4">
          <UserAvatar
            avatarUrl={profile?.avatarUrl ?? null}
            name={profileName || t("pageTitle")}
            size="lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="min-w-0 truncate text-lg font-semibold text-foreground">
                {profileName || t("pageTitle")}
              </h2>
              {/* 達成済みの最上位段級位。未達成なら何も出さない。
                  押すと道場（段級位のホーム）へ */}
              {currentRank && (
                <Link
                  href="/dojo"
                  data-belt-slug={currentRank.slug}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold transition-opacity hover:opacity-85 ${beltClass(currentRank.slug)} ${beltForegroundClass(currentRank.slug)}`}
                >
                  <span aria-hidden="true">🎓</span>
                  {tRanks(`names.${currentRank.slug}`)}
                </Link>
              )}
            </div>
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

        <section className="rounded-lg border-3 border-ink bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            <span className="mr-1">🔥</span>
            {t("activityTitle")}
          </h2>
          <ExpActivityHeatmap data={heatmapData} layout={heatmapLayout} />
        </section>

        {/* 各機能への導線。見に行くだけの行き先なので、太枠 + 影のカードでは
            なく行リンクで並べる（プロフィールとヒートマップがこのページの主役）。 */}
        <LinkRowList>
          {links.map((link) => (
            <LinkRow
              key={link.href}
              href={link.href}
              leading={
                <span className="text-base" aria-hidden="true">
                  {link.icon}
                </span>
              }
              title={link.title}
              description={link.summary}
            />
          ))}
        </LinkRowList>
      </div>
    </ContentContainer>
  );
}
