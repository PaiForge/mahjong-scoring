import type { Metadata } from "next";
import type { ComponentType } from "react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { createResultMetadata } from "@/app/_lib/metadata";

import { getLeaderboard } from "@/app/(user)/(public)/leaderboard/_actions/get-leaderboard";
import type { LeaderboardModule } from "@/app/(user)/(public)/leaderboard/_lib/types";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { buildDetailPath } from "@/app/(user)/(public)/leaderboard/_lib/types";
import type {
  PracticeMenuSlug,
  PracticeMenuType,
} from "@/lib/db/practice-menu-types";
import {
  isExamMenuType,
  practiceMenuBySlug,
} from "@/lib/db/practice-menu-types";
import { getExpInfoByChallengeResultId } from "@/lib/db/save-exp";
import type { ScoreComparison } from "@/lib/db/score-comparison-queries";
import { getScoreComparison } from "@/lib/db/score-comparison-queries";
import { getOptionalUser } from "@/lib/auth";
import { logExternalError } from "@/lib/log-error";

import { isRankSlug } from "@/lib/ranks/registry";

import { RecordSection } from "../_components/record-section";
import { PromotionBanner } from "../_components/promotion-banner";
import { LeaderboardPreview } from "../_components/leaderboard-preview";
import { LeaderboardSkeleton } from "../_components/leaderboard-skeleton";
import { ResultBlockSkeleton } from "../_components/result-block-skeleton";
import { SignUpCta } from "../_components/sign-up-cta";
import { debugResultDelay } from "./debug-delay";
import {
  practiceHref,
  practicePlayHref,
  practiceSetupHref,
} from "./practice-catalog";

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
  /**
   * 練習説明ページ（イントロ）の URL（例: "/practice/jantou-fu"）。
   * パンくずの中間リンクに使う。説明ページを持たない練習では省略し、
   * その場合は中間項目をリンクなしのテキストとして表示する。
   */
  readonly introHref?: string;
  /**
   * 出題設定へのリンク先（説明ページの設定セクション）。
   * 出題設定を持たない練習では undefined で、「設定を変更する」ボタンを出さない。
   */
  readonly settingsHref?: string;
  /** 正答数（URL クエリ `?correct=` から親 Server Component が parse して渡す） */
  readonly correct: number;
  /** 総出題数（URL クエリ `?total=` から親 Server Component が parse して渡す） */
  readonly total: number;
  /**
   * 昇級バナーのブロック（昇級がなければ undefined）。
   * URL クエリ `?promoted=` 由来の候補を `user_ranks` と突き合わせて描画する
   * 非同期ツリー。結果セクションの直後に表示される。
   */
  readonly promotionBlock?: React.ReactNode;
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
   *
   * ランキングを持たない練習（昇級試験）では undefined で、節ごと出さない。
   */
  readonly leaderboardBlock?: React.ReactNode;
  /**
   * 練習種別ごとの追加コンテンツ（問題別フィードバック一覧など）。
   * 現状はカスタムビュー (`createCustomResultView`) のみが使用する。
   * `resultBlock` と `leaderboardBlock` の間に描画される。
   */
  readonly children?: React.ReactNode;
}

interface ResultPageConfig {
  /**
   * ルートスラッグ（例: "jantou-fu"）。
   * ランキングの練習種別・辞書 namespace・プレイページ / 説明ページの URL は
   * すべてレジストリと命名規約から導出する。
   */
  readonly slug: PracticeMenuSlug;
}

/**
 * 結果ページのメタデータを生成する
 * 結果ページメタデータ
 *
 * 各 page.tsx の `generateMetadata` から練習の slug を渡して呼ぶ。
 * 辞書 namespace をレジストリから引くため、page.tsx 側に namespace を
 * 書かずに済む（`createPracticeResultPage` と同じ slug 1 つで完結する）。
 */
export async function createPracticeResultMetadata(
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return createResultMetadata(practiceMenuBySlug(slug).namespace);
}

/** Next.js 16 のページ props（searchParams は Promise） */
interface PracticeResultPageProps {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
}

/**
 * 練習結果ページを生成するファクトリー関数
 * 練習結果ページ生成
 *
 * 練習ごとに渡すのは slug 1 つで、ランキングの練習種別・練習名・プレイページ /
 * 説明ページの URL はレジストリ（`practiceMenuBySlug`）と `/practice/<slug>`
 * の命名規約から導出する。
 *
 * 設計: CLS 改善のために 2 つの Suspense 境界を導入している:
 *
 * 1. **即時描画（親 Server Component）**
 *    - PageTitle / SectionTitle("結果") / ResultScoreBar / アクションボタン
 *    - これらは URL クエリ (`?correct=&total=&time=`) のみで描画可能
 *
 * 2. **`<Suspense fallback={<ResultBlockSkeleton />}>`**
 *    - `AsyncResultBlock`: 認証判定 + EXP / 過去記録比較の取得 + `RecordSection` or `SignUpCta` 描画
 *
 * 3. **`<Suspense fallback={<LeaderboardSkeleton />}>`**
 *    - `AsyncLeaderboardBlock`: `getLeaderboard()` を呼んで `LeaderboardPreview` を描画
 *    - ランキングを持たない練習（昇級試験）では境界ごと出さない
 *
 * 2 と 3 は互いに並列に解決され、遅い方に全体が引っ張られないストリーミング表示となる。
 */
export function createPracticeResultPage(
  ResultView: ComponentType<PracticeResultViewProps>,
  config: ResultPageConfig,
) {
  const { slug } = config;
  const { menuType, namespace } = practiceMenuBySlug(slug);
  // 昇級試験は「繰り返し伸ばす」種類の練習ではないため、成績を横に並べる
  // 機能をどれも持たない。ランキングのプレビューも、過去記録との比較と
  // マイレコードへの導線も出さない
  const hasRecords = !isExamMenuType(menuType);

  return async function PracticeResultPage({
    searchParams,
  }: PracticeResultPageProps) {
    // 即時描画に必要な最小限のデータだけ親で解決する。
    // URL クエリ (`searchParams`) と、練習名（翻訳キー）。
    const [resolvedSearchParams, t] = await Promise.all([
      searchParams,
      getTranslations(namespace),
    ]);
    const practiceTitle = t("title");

    const rawGrant = resolvedSearchParams.grant;
    const grantId = typeof rawGrant === "string" ? rawGrant : undefined;

    // 昇級バナー: promoted=<slug>（複数可）。未知のスラッグはここで落とし、
    // 実在検証（本人が保持しているか）は PromotionBanner 側で行う
    const rawPromoted = resolvedSearchParams.promoted;
    const promotedSlugs = (
      Array.isArray(rawPromoted)
        ? rawPromoted
        : typeof rawPromoted === "string"
          ? [rawPromoted]
          : []
    ).filter(isRankSlug);

    const rawCorrect = resolvedSearchParams.correct;
    const rawTotal = resolvedSearchParams.total;
    const correct = Number(typeof rawCorrect === "string" ? rawCorrect : 0);
    const total = Number(typeof rawTotal === "string" ? rawTotal : 0);

    return (
      <ResultView
        practiceTitle={practiceTitle}
        playHref={practicePlayHref(slug)}
        introHref={practiceHref(slug)}
        settingsHref={practiceSetupHref(slug)}
        correct={Number.isFinite(correct) ? correct : 0}
        total={Number.isFinite(total) ? total : 0}
        promotionBlock={
          promotedSlugs.length > 0 ? (
            // バナーは付加情報のため fallback は出さない（解決後に現れる）
            <Suspense>
              <PromotionBanner slugs={promotedSlugs} />
            </Suspense>
          ) : undefined
        }
        resultBlock={
          <Suspense fallback={<ResultBlockSkeleton />}>
            <AsyncResultBlock
              grantId={grantId}
              menuType={menuType}
              showHistory={hasRecords}
            />
          </Suspense>
        }
        leaderboardBlock={
          hasRecords ? (
            <Suspense fallback={<LeaderboardSkeleton />}>
              <AsyncLeaderboardBlock module={menuType} />
            </Suspense>
          ) : undefined
        }
      />
    );
  };
}

/**
 * 記録セクション / 登録 CTA を非同期に解決して描画する
 * 非同期結果ブロック
 *
 * 認証状態の判定と EXP・過去記録比較の取得を内包し、ストリーミング境界内で
 * 完結させる。
 * ログイン済み → `RecordSection`（EXP は grant があるときだけ、過去記録比較は
 * `showHistory` の練習でだけ）
 * 未ログイン → `SignUpCta`
 *
 * ログイン済みで grant が無い場合（スコア保存に失敗した等）も比較だけの
 * `RecordSection` を描画する — どの分岐でも 1 セクションが必ず現れることで、
 * `ResultBlockSkeleton` との置換でレイアウトが動かない。
 *
 * 比較を出さない練習では問い合わせ自体を投げない（描画に使わない結果を
 * 待つと、その分だけ境界の解決が遅れる）。
 */
async function AsyncResultBlock({
  grantId,
  menuType,
  showHistory,
}: {
  readonly grantId: string | undefined;
  readonly menuType: PracticeMenuType;
  readonly showHistory: boolean;
}) {
  // デバッグ用: `DEBUG_RESULT_DELAY_MS` が設定されていれば指定 ms 待機。
  // 本番では no-op（debugResultDelay 内で NODE_ENV をチェック）。
  await debugResultDelay();

  const user = await resolveCurrentUser();

  if (!user) {
    return <SignUpCta />;
  }

  const [expInfo, comparison] = await Promise.all([
    grantId ? tryFetchExpInfo(user.id, grantId) : undefined,
    showHistory
      ? tryFetchScoreComparison(user.id, menuType, grantId)
      : undefined,
  ]);

  return (
    <RecordSection
      expInfo={expInfo}
      comparison={comparison}
      menuType={menuType}
      showHistory={showHistory}
    />
  );
}

/**
 * リーダーボードプレビューを非同期に解決して描画する
 * 非同期リーダーボード
 */
async function AsyncLeaderboardBlock({
  module,
}: {
  readonly module: LeaderboardModule;
}) {
  // デバッグ用: `DEBUG_RESULT_DELAY_MS` が設定されていれば指定 ms 待機。
  // 本番では no-op（debugResultDelay 内で NODE_ENV をチェック）。
  await debugResultDelay();

  const { rows } = await getLeaderboard(module, "all-time", 1);
  const previewRows = rows.slice(
    0,
    PREVIEW_COUNT,
  ) satisfies readonly RankedLeaderboardRow[];
  const detailPath = buildDetailPath("all-time", module);

  return <LeaderboardPreview rows={previewRows} detailPath={detailPath} />;
}

async function resolveCurrentUser() {
  try {
    return await getOptionalUser();
  } catch (error) {
    logExternalError(
      "createPracticeResultPage",
      "failed to resolve user",
      error,
    );
    return undefined;
  }
}

async function tryFetchExpInfo(userId: string, challengeResultId: string) {
  try {
    return await getExpInfoByChallengeResultId(userId, challengeResultId);
  } catch (error) {
    logExternalError(
      "createPracticeResultPage",
      "failed to fetch exp info",
      error,
    );
    return undefined;
  }
}

async function tryFetchScoreComparison(
  userId: string,
  menuType: PracticeMenuType,
  currentResultId: string | undefined,
): Promise<ScoreComparison | undefined> {
  try {
    return await getScoreComparison(userId, menuType, currentResultId);
  } catch (error) {
    logExternalError(
      "createPracticeResultPage",
      "failed to fetch score comparison",
      error,
    );
    return undefined;
  }
}
