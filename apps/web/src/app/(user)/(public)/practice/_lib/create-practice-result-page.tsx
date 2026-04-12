import type { ComponentType } from 'react';
import { Suspense } from 'react';

import { getLeaderboard } from '@/app/(user)/(public)/leaderboard/_actions/get-leaderboard';
import type { LeaderboardModule, LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { buildDetailPath } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { getExpInfoByChallengeResultId } from '@/lib/db/save-exp';
import { createClient } from '@/lib/supabase/server';

import { ExpGainDisplay } from '../_components/exp-gain-display';

const PREVIEW_COUNT = 3;

/**
 * 結果ページ View Component の props 型
 * 練習結果ビュープロパティ
 */
export interface PracticeResultViewProps {
  /** リトライ用のプレイページURL */
  readonly playHref: string;
  /** リーダーボードプレビュー上位行 */
  readonly leaderboardRows: readonly LeaderboardRow[];
  /** リーダーボード詳細ページパス */
  readonly leaderboardDetailPath: string;
  /** スコア表示とボタンの間に挿入する追加コンテンツ（EXP カード・問題別フィードバック等） */
  readonly children?: React.ReactNode;
}

interface ResultPageConfig {
  /** ドリル種別 */
  readonly module: LeaderboardModule;
  /** リトライ用のプレイページURL */
  readonly playHref: string;
}

/** Next.js 16 のページ props（searchParams は Promise） */
interface PracticeResultPageProps {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
}

/**
 * 練習結果ページを生成するファクトリー関数
 * 練習結果ページ生成
 *
 * Server Component として getLeaderboard() でデータ取得し、
 * Client Component に props で渡す。`?grant=<challengeResultId>` が
 * 付与されている場合は EXP 付与情報を引き直して `ExpGainDisplay` を描画する。
 */
export function createPracticeResultPage(
  ResultView: ComponentType<PracticeResultViewProps>,
  config: ResultPageConfig,
) {
  return async function PracticeResultPage({ searchParams }: PracticeResultPageProps) {
    const [leaderboardResult, resolvedSearchParams] = await Promise.all([
      getLeaderboard(config.module, 'all-time', 1),
      searchParams,
    ]);

    const leaderboardRows = leaderboardResult.rows.slice(0, PREVIEW_COUNT);
    const leaderboardDetailPath = buildDetailPath('all-time', config.module);

    const rawGrant = resolvedSearchParams.grant;
    const grantId = typeof rawGrant === 'string' ? rawGrant : undefined;

    const expInfo = grantId ? await tryFetchExpInfo(grantId) : undefined;

    return (
      <Suspense>
        <ResultView
          playHref={config.playHref}
          leaderboardRows={leaderboardRows}
          leaderboardDetailPath={leaderboardDetailPath}
        >
          {expInfo ? <ExpGainDisplay expInfo={expInfo} /> : undefined}
        </ResultView>
      </Suspense>
    );
  };
}

async function tryFetchExpInfo(challengeResultId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return undefined;
    return await getExpInfoByChallengeResultId(user.id, challengeResultId);
  } catch (error) {
    console.error('[createPracticeResultPage] failed to fetch exp info:', error);
    return undefined;
  }
}
