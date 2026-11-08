/**
 * マイページトップ
 *
 * @description ログインユーザー専用のトップページ。EXP アクティビティヒートマップと
 *   各機能への行リンクを配置する。
 * @flow マイページ閲覧 → ヒートマップで日次アクティビティを確認 → マイレコードへ遷移
 *
 * @design 公開プロフィールへのリンクは英語でも日本語のページへ
 * 他の利用者を見せる画面（公開プロフィール `/u/<username>`）は英語で出さない
 * （利用者の自由入力を英語の画面に載せない方針）。英語のマイページからも
 * 「公開プロフィール」は日本語のページへ言語をまたいで張り、「日本語のみ」の印を
 * 添える。一方プロフィール編集（`/mypage/profile/edit`）は本人が自分の入力を
 * 整える画面で、他の利用者を見せる画面には当たらないので英語で出し、同じ言語で
 * 張る。張る先は公開状態の表から決める（`resolveNavTargetFor`）ので、公開範囲が
 * 変われば追従する。
 *
 * @design 日付は言語の書式、日の区切りは JST
 * ヒートマップの月名・曜日は辞書（`mypage.heatmap`）、選択日の日付は
 * `formatJstDayKeyLong(dayKey, locale)` で言語の書式にする。どの日の EXP かを
 * 決める日の区切りは、言語によらず JST のまま（`buildHeatmapLayout`）。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { BeltPill } from "@/app/[locale]/(user)/_components/belt-pill";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { UserAvatar } from "@/app/[locale]/(user)/_components/user-avatar";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileCardByUserId } from "@/lib/db/queries";
import { getExpHeatmapData } from "@/lib/db/get-exp-heatmap-data";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import { MyPageMenu } from "./_components/mypage-menu";
import { ExpActivityHeatmap } from "./_components/exp-activity-heatmap";
import { DESKTOP_WEEKS, buildHeatmapLayout } from "./_lib/heatmap-utils";
import { publicProfileHref } from "@/lib/users/public-profile-href";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

import { confirmedGuardOptions } from "../../_lib/guard-options";

/** プロフィール編集（ロケール非依存のパス） */
const PROFILE_EDIT_PATH = "/mypage/profile/edit";

/** プロフィール欄の行リンク（公開プロフィール・プロフィール編集）の見た目 */
const PROFILE_ACTION_CLASSES =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-100";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mypage">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/mypage");
  return createPrivateMetadata("mypage", "pageTitle", { locale });
}

export default async function MyPage({
  params,
}: PageProps<"/[locale]/mypage">) {
  const locale = await prepareRouteLocale(params, "/mypage");
  const t = await getTranslations("mypage");
  const tHeatmap = await getTranslations("mypage.heatmap");
  const tRanks = await getTranslations("ranks");
  const tNav = await getTranslations("nav");
  const { user } = await requireConfirmedUser(
    confirmedGuardOptions("/mypage", locale),
  );
  const [profile, heatmapData, rankSlugs] = await Promise.all([
    getProfileCardByUserId(user.id),
    getExpHeatmapData(user.id, new Date()),
    getUserRankSlugs(user.id),
  ]);
  const profileName = profile?.displayName ?? profile?.username ?? "";
  const currentRank = highestRank(rankSlugs);
  const profileTarget = profile?.username
    ? resolveNavTargetFor(publicProfileHref(profile.username), locale)
    : undefined;

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

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-6">
        <section className="flex items-center gap-4 rounded-panel border border-panel bg-card p-4">
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
                <BeltPill
                  slug={currentRank.slug}
                  label={tRanks(`names.${currentRank.slug}`)}
                  href={resolveNavTargetFor(DOJO_PATH, locale).href}
                />
              )}
            </div>
            {profile?.username && (
              <p className="text-sm text-surface-500">@{profile.username}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {profileTarget && (
                <LocaleNavLink
                  navTarget={profileTarget}
                  linkKind="plain"
                  className={PROFILE_ACTION_CLASSES}
                >
                  <span aria-hidden="true">👤</span>
                  <span>{t("viewProfile")}</span>
                  {profileTarget.crossLocale && (
                    <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
                  )}
                </LocaleNavLink>
              )}
              <Link
                href={resolveNavTargetFor(PROFILE_EDIT_PATH, locale).href}
                className={PROFILE_ACTION_CLASSES}
              >
                <span aria-hidden="true">✏️</span>
                <span>{t("editProfile")}</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-panel border border-panel bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            <span className="mr-1">🔥</span>
            {t("activityTitle")}
          </h2>
          <ExpActivityHeatmap data={heatmapData} layout={heatmapLayout} />
        </section>

        <MyPageMenu locale={locale} />
      </div>
    </ContentContainer>
  );
}
