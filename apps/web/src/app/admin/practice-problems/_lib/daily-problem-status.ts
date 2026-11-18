import "server-only";
import { and, count, desc, eq, lt, sql } from "drizzle-orm";
import {
  ARCHIVE_SCHEMA_VERSION,
  parsePracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import { jstDayKey, jstDayStartIso } from "@mahjong-scoring/features/jst";
import { dailyProblems, db, practiceProblems } from "@/lib/db";
import { isDailyProblemEligible } from "@mahjong-scoring/features/daily-problem/eligibility";

/**
 * 本日の問題の候補在庫と直近の公開状態を読む。選出・固定はしない。
 * 本日の問題運用状況
 *
 * 全候補の再採点はせず、最大300件の標本で適格数を数える。標本が全件なら
 * 在庫の正確な数、一部なら下限。公開ページの要求ではこの検査を実行しない。
 */
export async function readDailyProblemStatus(now: Date) {
  const day = jstDayKey(now);
  const candidate = and(
    eq(practiceProblems.kind, "agari-score"),
    eq(practiceProblems.schemaVersion, ARCHIVE_SCHEMA_VERSION),
    lt(practiceProblems.createdAt, new Date(jstDayStartIso(day))),
    sql`${practiceProblems.id} NOT IN (SELECT ${dailyProblems.problemId} FROM ${dailyProblems})`,
  );
  const [totals, sample, recent] = await Promise.all([
    db.select({ total: count() }).from(practiceProblems).where(candidate),
    db
      .select({
        kind: practiceProblems.kind,
        schemaVersion: practiceProblems.schemaVersion,
        payload: practiceProblems.payload,
      })
      .from(practiceProblems)
      .where(candidate)
      .orderBy(practiceProblems.id)
      .limit(300),
    db.select().from(dailyProblems).orderBy(desc(dailyProblems.day)).limit(14),
  ]);
  const eligible = sample.filter((row) => {
    const parsed = parsePracticeProblemArchiveRequest(row);
    return (
      parsed.isOk() &&
      parsed.value.kind === "agari-score" &&
      isDailyProblemEligible(parsed.value.payload)
    );
  }).length;
  return {
    total: totals[0]?.total ?? 0,
    checked: sample.length,
    eligible,
    recent,
  };
}
