/**
 * リーダーボード詳細
 *
 * @description
 * リーダーボード詳細ページ。
 * 特定の練習モジュール・期間のランキングをページネーション付きで表示する。
 * 全期間ランキングは `challenge_best_scores` テーブル、
 * 月間ランキングは `challenge_results` テーブルから集計する。
 *
 * @flow
 * 1. 一覧ページのカードをクリックして遷移
 * 2. 指定モジュール・期間のランキングをテーブル表示
 * 3. 期間タブで全期間/月間を切り替え可能
 * 4. 20件ごとにページネーション
 * 5. ログイン中のユーザーがページ外にいる場合、画面下部に自分の順位を表示
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";
import { menuTypeToMessageKey } from "@/lib/db/practice-menu-types";

import { getLeaderboard } from "../../_actions/get-leaderboard";
import { LeaderboardDetailContent } from "../../_components/leaderboard-detail-content";
import type { LeaderboardModule, LeaderboardPeriod } from "../../_lib/types";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { buildChallengePath, slugToModule } from "../../_lib/types";
import { isValidModule, isValidPeriod } from "../../_lib/validators";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

export const dynamic = "force-dynamic";

interface LeaderboardDetailPageProps {
  params: Promise<{
    period: string;
    module: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

interface ValidatedParams {
  readonly period: LeaderboardPeriod;
  readonly module: LeaderboardModule;
}

function validateParams(
  periodStr: string,
  moduleSlug: string,
): ValidatedParams | undefined {
  if (!isValidPeriod(periodStr)) return undefined;

  // 練習種別として実在するだけでは足りない。ランキングを持たない練習
  // （昇級試験）のスラッグはここで落とす
  const resolvedModule = slugToModule(moduleSlug);
  if (!resolvedModule || !isValidModule(resolvedModule)) return undefined;

  return { period: periodStr, module: resolvedModule };
}

export async function generateMetadata({
  params,
}: LeaderboardDetailPageProps): Promise<Metadata> {
  const { period, module: moduleSlug } = await params;
  const validated = validateParams(period, moduleSlug);
  if (!validated) return {};

  const t = await getTranslations("leaderboard");
  const tPractices = await getTranslations("practice.practices");
  const msgKey = menuTypeToMessageKey(validated.module);
  const title = tPractices(`${msgKey}.shortTitle`);
  const periodLabel = t(`period.${validated.period}`);

  return createMetadata({
    title: `${title} (${periodLabel}) - ${t("title")}`,
  });
}

async function DetailContent({
  period,
  module: mod,
  page,
}: {
  readonly period: LeaderboardPeriod;
  readonly module: LeaderboardModule;
  readonly page: number;
}) {
  const user = await getOptionalUser();
  const currentUserId = user?.id ?? undefined;
  const viewerHidden =
    currentUserId === undefined
      ? false
      : await isHiddenFromLeaderboard(currentUserId);

  // 非表示中は母集団から外れているので順位行もハイライトも出ない。順位取得は
  // ランキング全体に ROW_NUMBER を回すため、undefined が返ると分かっている
  // 呼び出しは投げない。
  const data = await getLeaderboard(
    mod,
    period,
    page,
    viewerHidden ? undefined : currentUserId,
  );

  return (
    <LeaderboardDetailContent
      module={mod}
      currentUserId={currentUserId}
      data={data}
      currentPage={page}
      period={period}
      viewerHidden={viewerHidden}
    />
  );
}

export default async function LeaderboardDetailPage({
  params,
  searchParams,
}: LeaderboardDetailPageProps) {
  const { period, module: moduleSlug } = await params;
  const { page: pageParam } = await searchParams;

  const validated = validateParams(period, moduleSlug);
  if (!validated) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const t = await getTranslations("leaderboard");
  const tPractices = await getTranslations("practice.practices");

  const moduleMsgKey = menuTypeToMessageKey(validated.module);
  const moduleTitle = tPractices(`${moduleMsgKey}.shortTitle`);
  const challengePath = buildChallengePath(validated.module);

  return (
    <ContentContainer
      className="space-y-6"
      breadcrumb={[
        { label: t("title"), href: "/leaderboard" },
        { label: moduleTitle },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>

      <SectionTitle>{moduleTitle}</SectionTitle>

      <Suspense
        key={`${validated.period}:${page}`}
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBar key={i} className="h-12 w-full" tone={100} />
            ))}
          </div>
        }
      >
        <DetailContent
          period={validated.period}
          module={validated.module}
          page={page}
        />
      </Suspense>

      <div className="pt-4 border-t-2 border-dashed border-border/40">
        <LinkButton href={challengePath} fullWidth>
          <PlayIcon className="size-4" />
          {t("tryChallenge")}
        </LinkButton>
      </div>
    </ContentContainer>
  );
}
