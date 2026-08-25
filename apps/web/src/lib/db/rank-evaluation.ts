import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type { RankRequirement, RankSlug } from "@/lib/ranks/registry";
import { RANK_REGISTRY } from "@/lib/ranks/registry";
import { db } from "./index";
import { challengeBestScores, userRanks } from "./schema";

/**
 * 昇級判定 — 未達成ランクの要件評価と付与
 * 昇級判定
 *
 * @description
 * チャレンジ結果の保存後に呼ばれ、未達成の全ランクを独立に評価して
 * 要件を満たしたものを `user_ranks` に付与する。下位ランクの未達成が
 * 上位ランクの評価をブロックしない（skip-grant 許容）。
 *
 * @design 評価関数は要件 `type` ごとに登録する
 *
 * ランク slug ごとの分岐にしない。ランクの追加はレジストリ
 * （`lib/ranks/registry.ts`）1行で完結し、コード変更が要るのは
 * 新しい要件「型」を導入するときだけ。
 *
 * @design 呼び出し位置はトランザクションの外
 *
 * `challenge_best_scores` の UPSERT がコミットされた後でないと最新の
 * ベストを読めないため、`saveChallengeResult` のトランザクションには
 * 入れない。呼び出し側（`savePracticeResult`）は try-catch で包み、
 * **昇級判定の失敗が結果保存を壊さない**ようにする。
 */

/** 要件評価に使う事前取得データ */
interface RankEvalContext {
  /** (menuType, leaderboardKey) → ベストスコア */
  readonly getBestScore: (
    menuType: string,
    leaderboardKey: string,
  ) => number | undefined;
}

function bestScoreKey(menuType: string, leaderboardKey: string): string {
  return `${menuType}:${leaderboardKey}`;
}

type RequirementEvaluator<T extends RankRequirement = RankRequirement> = (
  ctx: RankEvalContext,
  requirement: T,
) => boolean;

/**
 * 要件型ごとの評価関数レジストリ
 * 要件評価関数
 *
 * `RankRequirement` は union のため、型を足すとここが網羅されるまで
 * コンパイルエラーになる（Record のキーが union の `type` 全種）。
 */
const evaluators: {
  readonly [T in RankRequirement as T["type"]]: RequirementEvaluator<T>;
} = {
  challenge_score: (ctx, requirement) => {
    const best = ctx.getBestScore(
      requirement.menuType,
      requirement.leaderboardKey,
    );
    return best !== undefined && best >= requirement.minScore;
  },
};

/** 1ランクの全要件を評価する（暗黙の AND） */
export function evaluateRankRequirements(
  ctx: RankEvalContext,
  requirements: readonly RankRequirement[],
): boolean {
  return requirements.every((requirement) =>
    evaluators[requirement.type](ctx, requirement),
  );
}

/**
 * 未達成ランクを評価し、要件を満たしたものを付与する
 * 昇級判定実行
 *
 * @returns 今回新たに付与されたランクの slug（付与順不同）。
 *   既達成・要件未達なら空配列。
 */
export async function checkAndGrantRanks(
  userId: string,
): Promise<readonly RankSlug[]> {
  // 1. 達成済みランクを除いた評価対象を決める
  const achievedRows = await db
    .select({ rankSlug: userRanks.rankSlug })
    .from(userRanks)
    .where(eq(userRanks.userId, userId));
  const achieved = new Set(achievedRows.map((row) => row.rankSlug));
  const unachieved = RANK_REGISTRY.filter((rank) => !achieved.has(rank.slug));
  if (unachieved.length === 0) return [];

  // 2. 評価に必要なベストスコアを1クエリで取得する
  const menuTypes = [
    ...new Set(
      unachieved.flatMap((rank) =>
        rank.requirements.map((requirement) => requirement.menuType),
      ),
    ),
  ];
  const bestRows = await db
    .select({
      menuType: challengeBestScores.menuType,
      leaderboardKey: challengeBestScores.leaderboardKey,
      score: challengeBestScores.score,
    })
    .from(challengeBestScores)
    .where(
      and(
        eq(challengeBestScores.userId, userId),
        inArray(challengeBestScores.menuType, menuTypes),
      ),
    );
  const bestScores = new Map(
    bestRows.map((row) => [
      bestScoreKey(row.menuType, row.leaderboardKey),
      row.score,
    ]),
  );
  const ctx: RankEvalContext = {
    getBestScore: (menuType, leaderboardKey) =>
      bestScores.get(bestScoreKey(menuType, leaderboardKey)),
  };

  // 3. 要件を満たしたランクを冪等に付与する。並行実行と競合した場合は
  //    onConflictDoNothing + returning により「実際に挿入できた側」だけが
  //    付与として報告される
  const qualified = unachieved.filter((rank) =>
    evaluateRankRequirements(ctx, rank.requirements),
  );
  if (qualified.length === 0) return [];

  const inserted = await db
    .insert(userRanks)
    .values(qualified.map((rank) => ({ userId, rankSlug: rank.slug })))
    .onConflictDoNothing()
    .returning({ rankSlug: userRanks.rankSlug });

  const qualifiedSlugs = new Set<string>(qualified.map((rank) => rank.slug));
  return inserted
    .map((row) => row.rankSlug)
    .filter((slug): slug is RankSlug => qualifiedSlugs.has(slug));
}
