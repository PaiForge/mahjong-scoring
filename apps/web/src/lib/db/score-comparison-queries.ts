import "server-only";

import { and, desc, eq, lte, ne } from "drizzle-orm";

import { db } from "./index";
import type { PracticeMenuType } from "./practice-menu-types";
import { challengeResults } from "./schema";

/**
 * ランキングセグメントキー。現状は全練習で `"default"` 固定
 * （`savePracticeResult` の `ALLOWED_LEADERBOARD_KEYS` 参照）。
 * キーが増えたとき、設定の異なるスコア同士を比較しないための条件。
 */
const LEADERBOARD_KEY = "default";

/**
 * 今回の記録と過去の自己記録の比較サマリ
 * スコア比較
 *
 * 結果ページの記録セクションで「これまでのベスト」「前回」との比較を
 * 表示するための値。比較対象が存在しない項目は undefined。
 */
export interface ScoreComparison {
  /**
   * 今回のスコア。`challenge_results` の該当行（= `grant` クエリの
   * challengeResultId）から取得する。行が特定できない場合
   * （保存失敗・URL 直叩き等）は undefined で、比較の基準点なしとして扱う。
   */
  readonly currentScore: number | undefined;
  /** 今回を除いた、これまでのベストスコア。過去の記録が無ければ undefined */
  readonly previousBestScore: number | undefined;
  /** 前回（今回の直前の記録）のスコア。過去の記録が無ければ undefined */
  readonly previousScore: number | undefined;
}

/**
 * 練習種別ごとの過去記録との比較サマリを取得する
 * スコア比較取得
 *
 * 結果ページが描画される時点で今回のスコアは `challenge_results` に保存済みの
 * ため、「これまでのベスト」「前回」は今回の行を除外して求める。除外は id の
 * 不一致に加えて createdAt でも絞る — 古い結果 URL を開き直したとき、今回より
 * 後に走った記録が「前回」として混ざらないようにするため。
 *
 * @param userId - 対象ユーザー
 * @param menuType - 練習種別
 * @param currentResultId - 今回の `challenge_results.id`（`grant` クエリ由来）。
 *   未指定・他人の行・他練習の行の場合は基準点なしで過去記録だけを返す
 */
export async function getScoreComparison(
  userId: string,
  menuType: PracticeMenuType,
  currentResultId: string | undefined,
): Promise<ScoreComparison> {
  const current = currentResultId
    ? await fetchCurrentResult(userId, menuType, currentResultId)
    : undefined;

  const pastWhere = and(
    eq(challengeResults.userId, userId),
    eq(challengeResults.menuType, menuType),
    eq(challengeResults.leaderboardKey, LEADERBOARD_KEY),
    ...(current
      ? [
          ne(challengeResults.id, current.id),
          lte(challengeResults.createdAt, current.createdAt),
        ]
      : []),
  );

  const [bestRows, lastRows] = await Promise.all([
    db
      .select({ score: challengeResults.score })
      .from(challengeResults)
      .where(pastWhere)
      .orderBy(desc(challengeResults.score))
      .limit(1),
    db
      .select({ score: challengeResults.score })
      .from(challengeResults)
      .where(pastWhere)
      .orderBy(desc(challengeResults.createdAt))
      .limit(1),
  ]);

  return {
    currentScore: current?.score,
    previousBestScore: bestRows[0]?.score,
    previousScore: lastRows[0]?.score,
  };
}

/**
 * 今回の記録行を取得する
 * 今回記録取得
 *
 * `grant` クエリはユーザーが書き換えられるため、本人の行かつ同じ練習種別の
 * 行であることを条件に含める。一致しなければ undefined。
 */
async function fetchCurrentResult(
  userId: string,
  menuType: PracticeMenuType,
  currentResultId: string,
) {
  const rows = await db
    .select({
      id: challengeResults.id,
      score: challengeResults.score,
      createdAt: challengeResults.createdAt,
    })
    .from(challengeResults)
    .where(
      and(
        eq(challengeResults.id, currentResultId),
        eq(challengeResults.userId, userId),
        eq(challengeResults.menuType, menuType),
      ),
    )
    .limit(1);
  return rows[0];
}
