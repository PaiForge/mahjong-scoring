import type { ComponentType } from 'react';
import { Suspense } from 'react';

import { getLeaderboard } from '@/app/(user)/(public)/leaderboard/_actions/get-leaderboard';
import type { LeaderboardModule, LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { buildDetailPath } from '@/app/(user)/(public)/leaderboard/_lib/types';
import { getExpInfoByChallengeResultId } from '@/lib/db/save-exp';
import { createClient } from '@/lib/supabase/server';

import { ExpGainDisplay } from '../_components/exp-gain-display';
import { LeaderboardPreview } from '../_components/leaderboard-preview';
import { LeaderboardSkeleton } from '../_components/leaderboard-skeleton';
import { ResultBlockSkeleton } from '../_components/result-block-skeleton';
import { SignUpCta } from '../_components/sign-up-cta';
import { debugResultDelay } from './debug-delay';

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
  /** 正答数（URL クエリ `?correct=` から親 Server Component が parse して渡す） */
  readonly correct: number;
  /** 総出題数（URL クエリ `?total=` から親 Server Component が parse して渡す） */
  readonly total: number;
  /**
   * 経験値セクション / 登録 CTA のブロック。
   * `<Suspense fallback={<ResultBlockSkeleton />}>` で包まれた
   * 非同期ツリーを Server 側で組み立てて渡す。
   */
  readonly resultBlock: React.ReactNode;
  /**
   * リーダーボードプレビューのブロック。
   * `<Suspense fallback={<LeaderboardSkeleton />}>` で包まれた
   * 非同期ツリーを Server 側で組み立てて渡す。
   */
  readonly leaderboardBlock: React.ReactNode;
  /**
   * 練習種別ごとの追加コンテンツ（問題別フィードバック一覧など）。
   * 現状はカスタムビュー (`createCustomResultView`) のみが使用する。
   * `resultBlock` と `leaderboardBlock` の間に描画される。
   */
  readonly children?: React.ReactNode;
}

interface ResultPageConfig {
  /** 練習種別 */
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
 * 設計: CLS 改善のために 2 つの Suspense 境界を導入している:
 *
 * 1. **即時描画（親 Server Component）**
 *    - PageTitle / SectionTitle("結果") / ResultScoreBar / アクションボタン
 *    - これらは URL クエリ (`?correct=&total=&time=`) のみで描画可能
 *
 * 2. **`<Suspense fallback={<ResultBlockSkeleton />}>`**
 *    - `AsyncResultBlock`: 認証判定 + grant からの EXP 取得 + `ExpGainDisplay` or `SignUpCta` 描画
 *
 * 3. **`<Suspense fallback={<LeaderboardSkeleton />}>`**
 *    - `AsyncLeaderboardBlock`: `getLeaderboard()` を呼んで `LeaderboardPreview` を描画
 *
 * 2 と 3 は互いに並列に解決され、遅い方に全体が引っ張られないストリーミング表示となる。
 */
export function createPracticeResultPage(
  ResultView: ComponentType<PracticeResultViewProps>,
  config: ResultPageConfig,
) {
  return async function PracticeResultPage({ searchParams }: PracticeResultPageProps) {
    // 即時描画に必要な最小限のデータだけ親で解決する。
    // URL クエリ (`searchParams`) と、練習名（翻訳キー）。
    const [resolvedSearchParams, practiceTitle] = await Promise.all([
      searchParams,
      config.resolveTitle(),
    ]);

    const rawGrant = resolvedSearchParams.grant;
    const grantId = typeof rawGrant === 'string' ? rawGrant : undefined;

    const rawCorrect = resolvedSearchParams.correct;
    const rawTotal = resolvedSearchParams.total;
    const correct = Number(typeof rawCorrect === 'string' ? rawCorrect : 0);
    const total = Number(typeof rawTotal === 'string' ? rawTotal : 0);

    return (
      <ResultView
        practiceTitle={practiceTitle}
        playHref={config.playHref}
        correct={Number.isFinite(correct) ? correct : 0}
        total={Number.isFinite(total) ? total : 0}
        resultBlock={
          <Suspense fallback={<ResultBlockSkeleton />}>
            <AsyncResultBlock grantId={grantId} />
          </Suspense>
        }
        leaderboardBlock={
          <Suspense fallback={<LeaderboardSkeleton />}>
            <AsyncLeaderboardBlock module={config.module} />
          </Suspense>
        }
      />
    );
  };
}

/**
 * 経験値セクション / 登録 CTA を非同期に解決して描画する
 * 非同期結果ブロック
 *
 * 認証状態の判定と EXP 取得を内包し、ストリーミング境界内で完結させる。
 * ログイン済みで grant 付き → `ExpGainDisplay`
 * ログイン済みで grant なし → なし（`Suspense` 解決後に空になる）
 * 未ログイン → `SignUpCta`
 */
async function AsyncResultBlock({ grantId }: { readonly grantId: string | undefined }) {
  // デバッグ用: `DEBUG_RESULT_DELAY_MS` が設定されていれば指定 ms 待機。
  // 本番では no-op（debugResultDelay 内で NODE_ENV をチェック）。
  await debugResultDelay();

  const user = await resolveCurrentUser();

  if (!user) {
    return <SignUpCta />;
  }

  if (!grantId) {
    return undefined;
  }

  const expInfo = await tryFetchExpInfo(user.id, grantId);
  if (!expInfo) return undefined;

  return <ExpGainDisplay expInfo={expInfo} />;
}

/**
 * リーダーボードプレビューを非同期に解決して描画する
 * 非同期リーダーボード
 */
async function AsyncLeaderboardBlock({ module }: { readonly module: LeaderboardModule }) {
  // デバッグ用: `DEBUG_RESULT_DELAY_MS` が設定されていれば指定 ms 待機。
  // 本番では no-op（debugResultDelay 内で NODE_ENV をチェック）。
  await debugResultDelay();

  const { rows } = await getLeaderboard(module, 'all-time', 1);
  const previewRows = rows.slice(0, PREVIEW_COUNT) satisfies readonly LeaderboardRow[];
  const detailPath = buildDetailPath('all-time', module);

  return <LeaderboardPreview rows={previewRows} detailPath={detailPath} />;
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
