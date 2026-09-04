import "server-only";

import { and, desc, eq, lte, ne } from "drizzle-orm";

import { db } from "./index";
import type { PracticeMenuType } from "./practice-menu-types";
import type { RankingValues } from "./ranking-order";
import { rankingOrder } from "./ranking-order";
import { challengeResults } from "./schema";

/**
 * ランキングセグメントキー。現状は全練習で `"default"` 固定
 * （`savePracticeResult` の `ALLOWED_LEADERBOARD_KEYS` 参照）。
 * キーが増えたとき、設定の異なるスコア同士を比較しないための条件。
 */
const LEADERBOARD_KEY = "default";

/**
 * 比較に使う 1 回分の成績
 * 比較用成績
 *
 * スコアだけでなくミス数・所要時間も持つ。「自己ベスト更新」の判定が
 * ランキングと同じ順序規則（{@link rankingOrder}）で行われるため。
 */
export type ScoreRecord = RankingValues;

/**
 * 今回の記録と過去の自己記録の比較サマリ
 * スコア比較
 *
 * 結果ページの記録セクションで「今回」「前回」「これまでのベスト」を
 * 並べるための値。該当する記録が存在しない項目は undefined。
 */
export interface ScoreComparison {
  /**
   * 今回の成績。`challenge_results` の該当行（= `grant` クエリの
   * challengeResultId）から取得する。行が特定できない場合
   * （保存失敗・URL 直叩き等）は undefined で、比較の基準点なしとして扱う。
   */
  readonly current: ScoreRecord | undefined;
  /** 今回を除いた、これまでのベスト。過去の記録が無ければ undefined */
  readonly previousBest: ScoreRecord | undefined;
  /** 前回（今回の直前の記録）。過去の記録が無ければ undefined */
  readonly previousLast: ScoreRecord | undefined;
}

/** 比較に使う成績の列。今回・過去のどのクエリでも同じ形を返す */
const scoreColumns = {
  score: challengeResults.score,
  incorrectAnswers: challengeResults.incorrectAnswers,
  timeTaken: challengeResults.timeTaken,
} as const;

/**
 * 練習種別ごとの過去記録との比較サマリを取得する
 * スコア比較取得
 *
 * 結果ページが描画される時点で今回のスコアは `challenge_results` に保存済みの
 * ため、「これまでのベスト」「前回」は今回の行を除外して求める。除外は id の
 * 不一致に加えて createdAt でも絞る — 古い結果 URL を開き直したとき、今回より
 * 後に走った記録が「前回」として混ざらないようにするため。
 *
 * ベストは `challenge_best_scores` を見ない。今回の保存で既に UPSERT 済みで、
 * 「今回より前のベスト」を答えられなくなっているため、追記専用の
 * `challenge_results` から順位規則で引き直す。
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
      .select(scoreColumns)
      .from(challengeResults)
      .where(pastWhere)
      // ランキングと同じ順序（スコア降順 → ミス昇順 → 所要時間昇順）
      .orderBy(...rankingOrder(challengeResults))
      .limit(1),
    db
      .select(scoreColumns)
      .from(challengeResults)
      .where(pastWhere)
      .orderBy(desc(challengeResults.createdAt))
      .limit(1),
  ]);

  return {
    current: current
      ? {
          score: current.score,
          incorrectAnswers: current.incorrectAnswers,
          timeTaken: current.timeTaken,
        }
      : undefined,
    previousBest: bestRows[0],
    previousLast: lastRows[0],
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
      createdAt: challengeResults.createdAt,
      ...scoreColumns,
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
