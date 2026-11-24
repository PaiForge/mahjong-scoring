// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../db", async () => {
  const { practiceProblemsTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? practiceProblemsTestDb()
      : undefined,
  };
});

import {
  compareNumbers,
  parsePracticeProblemArchiveRequest,
  SCORING_VERSION,
} from "@mahjong-scoring/core";
import {
  eligibleAgariPayload,
  kazoeYakumanAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  renfonpaiAgariPayload,
  yakumanAgariPayload,
} from "@mahjong-scoring/features/daily-problem/test-fixtures";
import {
  PROBLEM_CATEGORIES,
  problemMatchesCategory,
  type ProblemCategory,
} from "@mahjong-scoring/features/problem-facets/categories";
import {
  computeProblemFacets,
  type ProblemFacetInput,
} from "@mahjong-scoring/features/problem-facets/compute";
import {
  agariInput,
  kiriageOnlyWithRenfonpaiAgariPayload,
  noYakuAgariPayload,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  suuankouTankiAgariPayload,
  tenpaiInput,
} from "@mahjong-scoring/features/problem-facets/test-fixtures";
import { and, sql } from "drizzle-orm";

import {
  practiceProblemFacetSets,
  practiceProblemFacets,
  practiceProblems,
} from "../db/schema";

import { categoryCondition, currentOkFacetSet } from "./facet-condition-sql";
import { fillMissingProblemFacets } from "./facets";
import {
  closePracticeProblemsTestDb,
  practiceProblemsTestDb,
  setupPracticeProblemsTestDb,
} from "./test-database";
import {
  allKanAgariRequest,
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "./test-requests";

const url = process.env.BILLING_TEST_DATABASE_URL;

type Rule = Pick<ProblemCategory, "condition" | "tenpaiMatch">;

/** 検証を通した要求を属性の計算の入力にする */
function requestInput(body: unknown): ProblemFacetInput {
  const parsed = parsePracticeProblemArchiveRequest(body);
  if (parsed.isErr()) throw new Error(parsed.error);
  return parsed.value;
}

/** 突き合わせに使う盤面（門前・副露・槓・役満・役なしロンの聴牌形・計算できない盤面） */
const INPUTS: readonly ProblemFacetInput[] = [
  agariInput(eligibleAgariPayload()),
  agariInput(otherEligibleAgariPayload()),
  agariInput(kiriageBoundaryAgariPayload()),
  agariInput(renfonpaiAgariPayload()),
  agariInput(yakumanAgariPayload()),
  agariInput(kazoeYakumanAgariPayload()),
  agariInput(kiriageOnlyWithRenfonpaiAgariPayload()),
  agariInput(suuankouTankiAgariPayload()),
  agariInput(noYakuAgariPayload()),
  tenpaiInput(noYakuRonTenpaiPayload()),
  tenpaiInput(riichiTenpaiPayload()),
  requestInput(meldedAgariRequest()),
  requestInput(allKanAgariRequest()),
  requestInput(riichiTenpaiRequest()),
];

/** 同じ固定盤面の採点は一度だけ行い、全分類で同じ属性を照合する。 */
const INPUT_FACETS = INPUTS.map(computeProblemFacets);

/** レジストリの分類に無い項目の組み合わせと、`all` の意味 */
const EXTRA_RULES: readonly Rule[] = [
  ...(["any", "all"] as const).flatMap(
    (tenpaiMatch) =>
      [
        { condition: { fuIn: [30, 50] }, tenpaiMatch },
        { condition: { fuIn: [] }, tenpaiMatch },
        { condition: { fuMin: 30, fuMax: 40 }, tenpaiMatch },
        { condition: { fuMin: 30, fuMax: 30 }, tenpaiMatch },
        { condition: { fuMax: 25 }, tenpaiMatch },
        { condition: { hanEq: 3 }, tenpaiMatch },
        { condition: { hanMin: 3, hanMax: 3 }, tenpaiMatch },
        { condition: { hanMin: 4 }, tenpaiMatch },
        { condition: { hanMax: 2 }, tenpaiMatch },
        { condition: { hanMin: 3, hanMax: 2 }, tenpaiMatch },
        { condition: { fuIn: [20], hanEq: 3 }, tenpaiMatch },
        {
          condition: {
            fuMin: 40,
            yakuAll: ["Riichi"],
            yakuAny: ["Haku", "Bakaze"],
          },
          tenpaiMatch,
        },
        { condition: { yakuAll: [] }, tenpaiMatch },
        { condition: { yakuAny: [] }, tenpaiMatch },
        { condition: { machiIn: [] }, tenpaiMatch },
        { condition: { scoreLevelIn: [] }, tenpaiMatch },
      ] satisfies readonly Rule[],
  ),
  { condition: {}, tenpaiMatch: "any" },
  { condition: {}, tenpaiMatch: "all" },
  { condition: { isTsumo: true }, tenpaiMatch: "any" },
  { condition: { isTsumo: true }, tenpaiMatch: "all" },
  { condition: { isTsumo: false }, tenpaiMatch: "any" },
  { condition: { isMenzen: true }, tenpaiMatch: "all" },
  { condition: { fuEq: 20 }, tenpaiMatch: "any" },
  { condition: { fuEq: 20 }, tenpaiMatch: "all" },
  { condition: { fuEq: 20, isTsumo: false }, tenpaiMatch: "any" },
  { condition: { fuMin: 30 }, tenpaiMatch: "all" },
  { condition: { yakuAll: ["Pinfu", "Tanyao"] }, tenpaiMatch: "all" },
  { condition: { yakuAll: ["MenzenTsumo"] }, tenpaiMatch: "any" },
  { condition: { yakuAll: ["MenzenTsumo"] }, tenpaiMatch: "all" },
  { condition: { yakuAny: ["Suuankou", "Chinitsu"] }, tenpaiMatch: "any" },
  // 待ちの形を持つ和了すべてが満たす条件（NULL の待ちを「満たさない」に数える）
  {
    condition: { machiIn: ["Ryanmen", "Shanpon", "Kanchan", "Tanki"] },
    tenpaiMatch: "all",
  },
  { condition: { machiIn: ["Shanpon"] }, tenpaiMatch: "all" },
  { condition: { scoreLevelIn: ["Yakuman"] }, tenpaiMatch: "any" },
  {
    condition: { scoreLevelIn: ["Normal"], isMenzen: true, isTsumo: true },
    tenpaiMatch: "any",
  },
];

describe.skipIf(!url)("分類の条件の SQL（PostgreSQL）", () => {
  /** 入れた順の問題の ID */
  const ids: string[] = [];

  beforeAll(async () => {
    await setupPracticeProblemsTestDb();
    for (const [index, input] of INPUTS.entries()) {
      const [row] = await practiceProblemsTestDb()
        .insert(practiceProblems)
        .values({
          kind: input.kind,
          schemaVersion: input.schemaVersion,
          identityVersion: 1,
          contentHash: index.toString(16).padStart(64, "0"),
          // 検証済みの固定値。型だけ列の形に合わせる
          payload: input.payload as never,
          source: "web",
        })
        .returning({ id: practiceProblems.id });
      if (!row) throw new Error("Missing fixture");
      ids.push(row.id);
    }
    await fillMissingProblemFacets();
  });
  afterAll(closePracticeProblemsTestDb);

  /** SQL の条件で選ばれた問題を、入れた順の番号にする */
  async function selectedBySql(rule: Rule): Promise<number[]> {
    const rows = await practiceProblemsTestDb()
      .select({ problemId: practiceProblemFacetSets.problemId })
      .from(practiceProblemFacetSets)
      .where(and(currentOkFacetSet(), categoryCondition(rule)));
    return rows.map((row) => ids.indexOf(row.problemId)).sort(compareNumbers);
  }

  /** 属性に対する判定で選ばれる問題の番号 */
  function selectedByPredicate(rule: Rule): number[] {
    return INPUT_FACETS.flatMap((facets, index) =>
      problemMatchesCategory(rule, facets) ? [index] : [],
    );
  }

  it.each(PROBLEM_CATEGORIES.map((category) => [category.id, category]))(
    "分類 %s は、属性に対する判定と同じ問題を選ぶ",
    async (_id, category) => {
      expect(await selectedBySql(category)).toEqual(
        selectedByPredicate(category),
      );
    },
  );

  it.each(
    EXTRA_RULES.map((rule) => [
      `${JSON.stringify(rule.condition)} / ${rule.tenpaiMatch}`,
      rule,
    ]),
  )("条件 %s は、属性に対する判定と同じ問題を選ぶ", async (_name, rule) => {
    expect(await selectedBySql(rule)).toEqual(selectedByPredicate(rule));
  });

  it("突き合わせが空振りしていない（どの分類の項目も、選ぶ問題と選ばない問題がある）", () => {
    const counts = [...PROBLEM_CATEGORIES, ...EXTRA_RULES].map(
      (rule) => selectedByPredicate(rule).length,
    );
    expect(counts.filter((count) => count > 0).length).toBeGreaterThan(25);
    expect(counts.every((count) => count < INPUTS.length)).toBe(true);
  });

  it("和了の数だけ問題を増やさない（待ち 3 つの聴牌形も 1 問として数える）", async () => {
    const [row] = await practiceProblemsTestDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(practiceProblemFacetSets)
      .where(
        and(
          currentOkFacetSet(),
          categoryCondition({
            condition: { yakuAll: ["Riichi"] },
            tenpaiMatch: "any",
          }),
        ),
      );
    expect(row?.count).toBe(
      selectedByPredicate({
        condition: { yakuAll: ["Riichi"] },
        tenpaiMatch: "any",
      }).length,
    );
  });

  it("別の版の行は選ばない（この版では計算できない問題に、別の版の行があっても）", async () => {
    // 役なしの和了形（この版では failed）
    const failedIndex = 8;
    const problemId = ids[failedIndex];
    if (!problemId) throw new Error("Missing fixture");
    const key = { problemId, scoringVersion: SCORING_VERSION + 1 };
    await practiceProblemsTestDb()
      .insert(practiceProblemFacetSets)
      .values({
        ...key,
        status: "ok",
        isOya: false,
        isMenzen: true,
        isRiichi: false,
        kanCount: 0,
        jikaze: 28,
        bakaze: 27,
      });
    await practiceProblemsTestDb()
      .insert(practiceProblemFacets)
      .values({
        ...key,
        agariHai: 20,
        isTsumo: false,
        result: "scored",
        han: 1,
        fu: 30,
        scoreLevel: "Normal",
        yakumanMultiplier: 0,
        points: 1000,
        yaku: ["Tanyao"],
        doraHan: 0,
        uraDoraHan: 0,
        machi: "Shanpon",
        variesByRenfonpai: false,
        variesByKiriage: false,
        variesByYakumanRules: false,
      });

    for (const tenpaiMatch of ["any", "all"] as const) {
      expect(await selectedBySql({ condition: {}, tenpaiMatch })).not.toContain(
        failedIndex,
      );
    }
  });
});
