import "server-only";

import type { RankDefinition, RankSlug } from "@/lib/ranks/registry";
import { nextRank } from "@/lib/ranks/registry";
import { db } from "./index";
import { getUserRankSlugs } from "./rank-queries";
import { userRanks } from "./schema";

/**
 * 昇級判定 — 試験 1 走行の採点と付与
 * 昇級判定
 *
 * @description
 * 昇級試験の走行が終わったとき（`submitExamResult`）に呼ばれ、「次に取る級」
 * （level 昇順で最初の未達成ランク）の試験がその走行なら、合格点に達して
 * いるかで合否を決めて `user_ranks` に付与する。試験の走行は記録しない —
 * 合否はその場の 1 走行だけで決まり、不合格の走行は何も残さず、合格の
 * 走行は段級位という形でだけ残る。
 *
 * 段級位は飛び級できない — 上位の試験で合格点を取っても、順番が来て
 * （= 下位をすべて取り、その級が「次」になり）その級の試験を受け直すまで
 * 付与されない。受験資格の強制は呼び出し側（`submitExamResult` の
 * `evaluateExamEligibility`）と二重になっているが、こちらは「次の級の
 * 試験でなければ付与しない」という判定そのものなので、資格ガードが
 * 外れても飛び級は成立しない。
 *
 * 過去の仕様（全ランク独立評価）で飛び番に付与されたユーザーは剥奪しない。
 * 「次に取る級」は最下位の未達成なので、飛ばした級を順に埋めていく形で
 * 再開する。
 */

/**
 * 採点対象の試験 1 走行
 * 試験走行
 */
export interface ExamRun {
  /** 受けた試験の練習種別 */
  readonly menuType: string;
  /** 制限時間内の正解数 */
  readonly score: number;
}

/**
 * 付与できるランクを選ぶ（次の級の試験に合格していればその1件）
 * 付与ランク選定
 *
 * 昇級判定の純粋な芯。評価対象は常に「次に取る級」1件だけで、上位ランクの
 * 試験で合格点を取っても選ばれない（飛び級の禁止）。全ランク達成済み、
 * 走行が次の級の試験でない、または合格点未満なら undefined。
 */
export function selectGrantableRank(
  achievedSlugs: readonly RankSlug[],
  run: ExamRun,
): RankDefinition | undefined {
  const next = nextRank(achievedSlugs);
  if (next === undefined) return undefined;
  if (next.exam.menuType !== run.menuType) return undefined;
  return run.score >= next.exam.minScore ? next : undefined;
}

/**
 * 試験の走行を採点し、次の級の合格なら付与する
 * 昇級判定実行
 *
 * @returns 今回新たに付与されたランクの slug（0 件または 1 件）。
 *   飛び級はないため複数付与は起きないが、呼び出し側の互換のため配列で返す。
 */
export async function gradeExamRun(
  userId: string,
  run: ExamRun,
): Promise<readonly RankSlug[]> {
  const achieved = await getUserRankSlugs(userId);
  const grantable = selectGrantableRank(achieved, run);
  if (grantable === undefined) return [];

  // 冪等に付与する。並行実行と競合した場合は onConflictDoNothing + returning
  // により「実際に挿入できた側」だけが付与として報告される
  const inserted = await db
    .insert(userRanks)
    .values({ userId, rankSlug: grantable.slug })
    .onConflictDoNothing()
    .returning({ rankSlug: userRanks.rankSlug });

  return inserted.length > 0 ? [grantable.slug] : [];
}
