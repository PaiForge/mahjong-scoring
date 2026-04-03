/**
 * @description
 * リーダーボード詳細ページ。
 * 特定のドリルモジュール・期間のランキングをページネーション付きで表示する。
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
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContentContainer } from '@/app/_components/content-container';
import { PageTitle } from '@/app/_components/page-title';
import { createMetadata } from '@/app/_lib/metadata';
import { getOptionalUser } from '@/lib/auth';

import { getLeaderboard } from '../../_actions/get-leaderboard';
import { LeaderboardDetailContent } from '../../_components/leaderboard-detail-content';
import type { LeaderboardModule, LeaderboardPeriod } from '../../_lib/types';
import { buildChallengePath, slugToModule } from '../../_lib/types';
import { isValidPeriod } from '../../_lib/validators';

export const dynamic = 'force-dynamic';

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

  const resolvedModule = slugToModule(moduleSlug);
  if (!resolvedModule) return undefined;

  return { period: periodStr, module: resolvedModule };
}

export async function generateMetadata({
  params,
}: LeaderboardDetailPageProps): Promise<Metadata> {
  const { period, module: moduleSlug } = await params;
  const validated = validateParams(period, moduleSlug);
  if (!validated) return {};

  const t = await getTranslations('leaderboard');
  const title = t(`module.${validated.module}`);
  const periodLabel = t(`period.${validated.period}`);

  return createMetadata({
    title: `${title} (${periodLabel}) - ${t('title')}`,
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
  const data = await getLeaderboard(mod, period, page, currentUserId);

  return (
    <LeaderboardDetailContent
      module={mod}
      currentUserId={currentUserId}
      data={data}
      currentPage={page}
      initialPeriod={period}
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

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const t = await getTranslations('leaderboard');

  const moduleTitle = t(`module.${validated.module}`);
  const challengePath = buildChallengePath(validated.module);

  return (
    <ContentContainer className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>
      <p className="text-sm text-surface-500">{moduleTitle}</p>

      <Suspense
        key={`${validated.period}:${page}`}
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-surface-100" />
            ))}
          </div>
        }
      >
        <DetailContent period={validated.period} module={validated.module} page={page} />
      </Suspense>

      <div className="pt-4 border-t border-surface-200">
        <Link
          href={challengePath}
          className="inline-flex items-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {t('tryChallenge')}
        </Link>
      </div>
    </ContentContainer>
  );
}
