import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type {
  RankDefinition,
  RankRequirement,
  RankSlug,
} from "@/lib/ranks/registry";
import { nextRank } from "@/lib/ranks/registry";
import { db } from "./index";
import { getUserRankSlugs } from "./rank-queries";
import { challengeBestScores, userRanks } from "./schema";

/**
 * 昇級判定 — 次の級の要件評価と付与
 * 昇級判定
 *
 * @description
 * 昇級試験の結果の保存後に呼ばれ（`savePracticeResult` が、どこかの級の
 * 要件が参照する練習メニューの保存でだけ呼ぶ）、「次に取る級」（level
 * 昇順で最初の未達成ランク）だけを評価して、要件を満たしていれば
 * `user_ranks` に付与する。試験以外の練習の保存では呼ばれない — 昇級は
 * 常にその試験の結果画面で本人に通知される。段級位は飛び級できない — 上位ランクの要件を先に満たしても、
 * 順番が来て（= 下位をすべて取り、その級が「次」になり）その級の試験を
 * 受け直すまで付与されない。上位試験のスコア自体が積まれないことは
 * `savePracticeResult` の受験資格ガード（`evaluateExamEligibility`）が
 * 保証する。
 *
 * 過去の仕様（全ランク独立評価）で飛び番に付与されたユーザーは剥奪しない。
 * 「次に取る級」は最下位の未達成なので、飛ばした級を順に埋めていく形で
 * 再開する。
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
 * 付与できるランクを選ぶ（次の級が要件を満たしていればその1件）
 * 付与ランク選定
 *
 * 昇級判定の純粋な芯。評価対象は常に「次に取る級」1件だけで、上位ランクの
 * 要件を満たすスコアがあっても選ばれない（飛び級の禁止）。全ランク達成済み、
 * または次の級の要件未達なら undefined。
 */
export function selectGrantableRank(
  achievedSlugs: readonly RankSlug[],
  ctx: RankEvalContext,
): RankDefinition | undefined {
  const next = nextRank(achievedSlugs);
  if (next === undefined) return undefined;
  return evaluateRankRequirements(ctx, next.requirements) ? next : undefined;
}

/**
 * 次の級の要件を評価し、満たしていれば付与する
 * 昇級判定実行
 *
 * @returns 今回新たに付与されたランクの slug（0 件または 1 件）。
 *   飛び級はないため複数付与は起きないが、呼び出し側の互換のため配列で返す。
 */
export async function checkAndGrantRanks(
  userId: string,
): Promise<readonly RankSlug[]> {
  // 1. 達成済みランクから「次に取る級」を決める
  const achieved = await getUserRankSlugs(userId);
  const next = nextRank(achieved);
  if (next === undefined) return [];

  // 2. 次の級の評価に必要なベストスコアだけを取得する
  const menuTypes = [
    ...new Set(next.requirements.map((requirement) => requirement.menuType)),
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

  // 3. 要件を満たしていれば冪等に付与する。並行実行と競合した場合は
  //    onConflictDoNothing + returning により「実際に挿入できた側」だけが
  //    付与として報告される
  const grantable = selectGrantableRank(achieved, ctx);
  if (grantable === undefined) return [];

  const inserted = await db
    .insert(userRanks)
    .values({ userId, rankSlug: grantable.slug })
    .onConflictDoNothing()
    .returning({ rankSlug: userRanks.rankSlug });

  return inserted.length > 0 ? [grantable.slug] : [];
}
