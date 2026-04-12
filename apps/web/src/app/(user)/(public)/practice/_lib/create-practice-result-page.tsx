import type { ComponentType } from 'react';
import { Suspense } from 'react';

import { getLeaderboard } from '@/app/(user)/(public)/leaderboard/_actions/get-leaderboard';
import type { LeaderboardModule, LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { buildDetailPath } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { getExpInfoByChallengeResultId } from '@/lib/db/save-exp';
import { createClient } from '@/lib/supabase/server';

import { ExpGainDisplay } from '../_components/exp-gain-display';
import { SignUpCta } from '../_components/sign-up-cta';

const PREVIEW_COUNT = 3;

/**
 * 結果ページ View Component の props 型
 * 練習結果ビュープロパティ
 */
export interface PracticeResultViewProps {
  /** ページタイトル（練習名） */
  readonly practiceTitle: string;
  /** リトライ用のプレイページURL */
  readonly playHref: string;
  /** リーダーボードプレビュー上位行 */
  readonly leaderboardRows: readonly LeaderboardRow[];
  /** リーダーボード詳細ページパス */
  readonly leaderboardDetailPath: string;
  /**
   * スコアバーとアクションボタンの間に挿入される追加コンテンツ。
   * 経験値セクション（`ExpGainDisplay`）や問題別フィードバック一覧など、
   * 結果ブロックとして一続きに表示したい要素を渡す。
   *
   * factory (`createPracticeResultPage`) は EXP をここに渡し、
   * カスタムビュー (`createCustomResultView`) は EXP と ProblemList を
   * Fragment で合成して渡す。`children` に統一することで、
   * Server Component の要素を Client 境界に安全に渡せる
   * （`children` スロットは Next.js 公式で推奨される渡し方）。
   */
  readonly children?: React.ReactNode;
}

interface ResultPageConfig {
  /** ドリル種別 */
  readonly module: LeaderboardModule;
  /** リトライ用のプレイページURL */
  readonly playHref: string;
  /**
   * ページタイトル（練習名）を解決する非同期関数。
   * 各 page.tsx 側で `getTranslations('<namespace>')` を呼んで `t('title')` を返す。
   * プロジェクトで主流の namespace 指定スタイルに揃えるため、
   * factory 内ではグローバルな翻訳ルックアップを避ける。
   */
  readonly resolveTitle: () => Promise<string>;
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
    const [leaderboardResult, resolvedSearchParams, practiceTitle, user] = await Promise.all([
      getLeaderboard(config.module, 'all-time', 1),
      searchParams,
      config.resolveTitle(),
      resolveCurrentUser(),
    ]);

    const leaderboardRows = leaderboardResult.rows.slice(0, PREVIEW_COUNT);
    const leaderboardDetailPath = buildDetailPath('all-time', config.module);

    const rawGrant = resolvedSearchParams.grant;
    const grantId = typeof rawGrant === 'string' ? rawGrant : undefined;

    // ログイン済みで grant 付きの場合のみ EXP を取得。
    // 未ログイン時は EXP を取得せず、代わりに登録 CTA を描画する。
    const expInfo = user && grantId ? await tryFetchExpInfo(user.id, grantId) : undefined;

    const resultBlock = user
      ? expInfo
        ? <ExpGainDisplay expInfo={expInfo} />
        : undefined
      : <SignUpCta />;

    return (
      <Suspense>
        <ResultView
          practiceTitle={practiceTitle}
          playHref={config.playHref}
          leaderboardRows={leaderboardRows}
          leaderboardDetailPath={leaderboardDetailPath}
        >
          {resultBlock}
        </ResultView>
      </Suspense>
    );
  };
}

async function resolveCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('[createPracticeResultPage] failed to resolve user:', error);
    return null;
  }
}

async function tryFetchExpInfo(userId: string, challengeResultId: string) {
  try {
    return await getExpInfoByChallengeResultId(userId, challengeResultId);
  } catch (error) {
    console.error('[createPracticeResultPage] failed to fetch exp info:', error);
    return undefined;
  }
}
