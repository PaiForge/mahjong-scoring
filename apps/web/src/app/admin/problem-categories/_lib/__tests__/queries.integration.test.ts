// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => {
  const { practiceProblemsTestDb } =
    await import("@/lib/practice-problems/test-database");
  return {
    ...(await import("@/lib/db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? practiceProblemsTestDb()
      : undefined,
  };
});

import {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
} from "@mahjong-scoring/features/daily-problem/test-fixtures";
import {
  findProblemCategory,
  PROBLEM_CATEGORIES,
  type ProblemCategory,
} from "@mahjong-scoring/features/problem-facets/categories";
import {
  kiriageOnlyWithRenfonpaiAgariPayload,
  noYakuAgariPayload,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  suuankouTankiAgariPayload,
} from "@mahjong-scoring/features/problem-facets/test-fixtures";

import { practiceProblems, type PracticeProblem } from "@/lib/db/schema";
import { fillMissingProblemFacets } from "@/lib/practice-problems/facets";
import {
  closePracticeProblemsTestDb,
  practiceProblemsTestDb,
  setupPracticeProblemsTestDb,
} from "@/lib/practice-problems/test-database";

import {
  CATEGORY_PROBLEMS_PAGE_SIZE,
  fetchCategoryCounts,
  fetchCategoryProblems,
} from "../queries";

const url = process.env.BILLING_TEST_DATABASE_URL;

function category(id: string): ProblemCategory {
  const found = findProblemCategory(id);
  if (!found) throw new Error(id);
  return found;
}

describe.skipIf(!url)("問題の分類の集計と一覧（PostgreSQL）", () => {
  let sequence = 0;

  /** 盤面を 1 行入れる（保存の日時は入れた順に 1 秒ずつ新しくする） */
  async function insertProblem(
    kind: "agari-score" | "tenpai-score",
    payload: PracticeProblem["payload"],
  ): Promise<string> {
    sequence += 1;
    const [row] = await practiceProblemsTestDb()
      .insert(practiceProblems)
      .values({
        kind,
        schemaVersion: 1,
        identityVersion: 1,
        contentHash: sequence.toString(16).padStart(64, "0"),
        payload,
        source: "web",
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)),
      })
      .returning({ id: practiceProblems.id });
    if (!row) throw new Error("Missing fixture");
    return row.id;
  }

  const ids: Record<string, string> = {};

  beforeAll(async () => {
    await setupPracticeProblemsTestDb();
    // リーチ・ツモ 2 翻 30 符（嵌張）
    ids.eligible = await insertProblem("agari-score", eligibleAgariPayload());
    // 白・ツモ 3 翻 30 符（両面）
    ids.other = await insertProblem("agari-score", otherEligibleAgariPayload());
    // リーチ・ツモ 4 翻 30 符（切り上げ満貫で変わる）
    ids.kiriage = await insertProblem(
      "agari-score",
      kiriageBoundaryAgariPayload(),
    );
    // 白・リーチのロン 3 翻 50 符（連風牌と切り上げ満貫で変わる）
    ids.both = await insertProblem(
      "agari-score",
      kiriageOnlyWithRenfonpaiAgariPayload(),
    );
    // 四暗刻単騎（役満のルールで変わる）
    ids.tanki = await insertProblem("agari-score", suuankouTankiAgariPayload());
    // 役なしの和了形（計算に失敗する）
    ids.failed = await insertProblem("agari-score", noYakuAgariPayload());
    // 聴牌形: リーチ・タンヤオ・平和の三面待ち（和了 6 つ）
    ids.riichiTenpai = await insertProblem(
      "tenpai-score",
      riichiTenpaiPayload(),
    );
    // 聴牌形: 役なしのロンを持つ双碰待ち（和了 4 つ）
    ids.noYakuRon = await insertProblem(
      "tenpai-score",
      noYakuRonTenpaiPayload(),
    );
    await fillMissingProblemFacets();
    // 未計算のまま残す問題（どの分類にも数えない）
    ids.missing = await insertProblem("agari-score", eligibleAgariPayload());
  });
  afterAll(closePracticeProblemsTestDb);

  it("種別ごとに、分類に当てはまる問題を数える（和了の数ではなく問題の数）", async () => {
    const counts = await fetchCategoryCounts();
    const byKind = new Map(counts.map((row) => [row.kind, row]));
    const agari = byKind.get("agari-score");
    const tenpai = byKind.get("tenpai-score");

    // 未計算の 1 問（リーチ・30 符）と失敗の 1 問は入らない
    expect(agari?.categories).toMatchObject({
      "yaku-riichi": 3,
      "yaku-yakuhai": 2,
      "fu-30": 3,
      "fu-50": 1,
      "machi-ryanmen": 1,
      "machi-kanchan": 2,
      "machi-penchan": 0,
      "machi-fu-2": 3,
      "machi-shanpon": 1,
      "machi-tanki": 1,
      "menzen-ron": 1,
      "menzen-false": 0,
      "mangan-plus": 1,
    });
    // 和了を 6 つ・4 つ持つ聴牌形も、それぞれ 1 問
    expect(tenpai?.categories).toMatchObject({
      "yaku-riichi": 1,
      "yaku-tanyao": 1,
      "yaku-pinfu": 1,
      "fu-20": 1,
      "fu-30": 2,
      "fu-40": 1,
      "machi-ryanmen": 1,
      "machi-shanpon": 1,
      "menzen-ron": 1,
    });
    expect(Object.keys(agari?.categories ?? {})).toEqual(
      PROBLEM_CATEGORIES.map(({ id }) => id),
    );
  });

  it("ルールで変わる印の立つ和了を持つ問題を、印ごとに数える", async () => {
    const counts = await fetchCategoryCounts();
    const byKind = new Map(counts.map((row) => [row.kind, row]));
    expect(byKind.get("agari-score")?.flags).toEqual({
      renfonpai: 1,
      kiriage: 2,
      yakumanRules: 1,
    });
    expect(byKind.get("tenpai-score")?.flags).toEqual({
      renfonpai: 0,
      kiriage: 0,
      yakumanRules: 0,
    });
  });

  it("分類に当てはまる問題を保存の新しい順に返し、和了ごとの属性を添える", async () => {
    const page = await fetchCategoryProblems(
      { type: "category", category: category("yaku-riichi") },
      1,
    );
    expect(page).toMatchObject({ total: 4, page: 1, totalPages: 1 });
    expect(page.problems.map((problem) => problem.id)).toEqual([
      ids.riichiTenpai,
      ids.both,
      ids.kiriage,
      ids.eligible,
    ]);

    const [tenpai, both] = page.problems;
    expect(tenpai?.set).toMatchObject({ status: "ok", waitCount: 3 });
    // 和了牌の順で、同じ和了牌はツモが先
    expect(tenpai?.rows.map((row) => [row.agariHai, row.isTsumo])).toEqual([
      [10, true],
      [10, false],
      [13, true],
      [13, false],
      [16, true],
      [16, false],
    ]);
    expect(both?.rows).toMatchObject([
      { han: 3, fu: 50, variesByRenfonpai: true, variesByKiriage: true },
    ]);
  });

  it("印で絞ると、その印の立つ和了を持つ問題だけを返す", async () => {
    const page = await fetchCategoryProblems(
      { type: "flag", flag: "kiriage" },
      1,
    );
    expect(page.problems.map((problem) => problem.id)).toEqual([
      ids.both,
      ids.kiriage,
    ]);
    const yakuman = await fetchCategoryProblems(
      { type: "flag", flag: "yakumanRules" },
      1,
    );
    expect(yakuman.problems.map((problem) => problem.id)).toEqual([ids.tanki]);
  });

  it("当てはまる問題が無ければ空の 1 ページを返し、範囲外のページは端に寄せる", async () => {
    const empty = await fetchCategoryProblems(
      { type: "category", category: category("yaku-chiitoitsu") },
      3,
    );
    expect(empty).toEqual({ problems: [], total: 0, page: 1, totalPages: 1 });

    const clamped = await fetchCategoryProblems(
      { type: "category", category: category("fu-30") },
      99,
    );
    expect(clamped).toMatchObject({ total: 5, page: 1, totalPages: 1 });
    expect(
      (
        await fetchCategoryProblems(
          { type: "category", category: category("fu-30") },
          0,
        )
      ).page,
    ).toBe(1);
    expect(CATEGORY_PROBLEMS_PAGE_SIZE).toBeGreaterThan(5);
  });
});
