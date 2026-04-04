import type { ComponentType } from 'react';
import { Suspense } from 'react';

import { getLeaderboard } from '@/app/(user)/(public)/leaderboard/_actions/get-leaderboard';
import type { LeaderboardModule, LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { buildDetailPath } from '@/app/(user)/(public)/leaderboard/_lib/types';

const PREVIEW_COUNT = 3;

/**
 * 結果ページ Client Component の props 型
 * 練習結果クライアントプロパティ
 */
export interface PracticeResultClientProps {
  /** リトライ用のプレイページURL */
  readonly playHref: string;
  /** リーダーボードプレビュー上位行 */
  readonly leaderboardRows: readonly LeaderboardRow[];
  /** リーダーボード詳細ページパス */
  readonly leaderboardDetailPath: string;
  /** スコア表示とボタンの間に挿入する追加コンテンツ（問題別フィードバック等） */
  readonly children?: React.ReactNode;
}

interface ResultPageConfig {
  /** ドリル種別 */
  readonly module: LeaderboardModule;
  /** リトライ用のプレイページURL */
  readonly playHref: string;
}

/**
 * 練習結果ページを生成するファクトリー関数
 * 練習結果ページ生成
 *
 * Server Component として getLeaderboard() でデータ取得し、
 * Client Component に props で渡す。
 */
export function createPracticeResultPage(
  ResultClient: ComponentType<PracticeResultClientProps>,
  config: ResultPageConfig,
) {
  return async function PracticeResultPage() {
    const leaderboardResult = await getLeaderboard(config.module, 'all-time', 1);
    const leaderboardRows = leaderboardResult.rows.slice(0, PREVIEW_COUNT);
    const leaderboardDetailPath = buildDetailPath('all-time', config.module);

    return (
      <Suspense>
        <ResultClient
          playHref={config.playHref}
          leaderboardRows={leaderboardRows}
          leaderboardDetailPath={leaderboardDetailPath}
        />
      </Suspense>
    );
  };
}
