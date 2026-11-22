// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createIsolatedSchemaTestDb } from "../db/isolated-schema-test-db";
import {
  practiceProblems,
  practiceProblemFacetSets,
  practiceProblemFacets,
  dailyProblems,
} from "../db/schema";

const testDb = createIsolatedSchemaTestDb({
  prefix: "facets_data",
  migrations: [
    "20261115230546_create_practice_problems.sql",
    "20261117104232_create_daily_problems.sql",
    "20261117223813_add_daily_problem_visibility.sql",
    "20261122001626_add_daily_answer_statistics.sql",
    "20261122002406_create_practice_problem_facets.sql",
  ],
});

const parent = {
  scoringVersion: 1,
  status: "ok",
  isOya: true,
  isMenzen: true,
  isRiichi: false,
  kanCount: 0,
  jikaze: 27,
  bakaze: 27,
  waitCount: 2,
} as const;
const child = {
  scoringVersion: 1,
  agariHai: 0,
  isTsumo: true,
  result: "scored",
  han: 1,
  fu: 30,
  scoreLevel: "Normal",
  yakumanMultiplier: 0,
  points: 1500,
  yaku: ["MenzenTsumo"],
  doraHan: 0,
  uraDoraHan: 0,
  variesByRenfonpai: false,
  variesByKiriage: false,
  variesByYakumanRules: false,
} satisfies Omit<typeof practiceProblemFacets.$inferInsert, "problemId">;

async function createProblem() {
  const [row] = await testDb
    .db()
    .insert(practiceProblems)
    .values({
      kind: "tenpai-score",
      schemaVersion: 1,
      identityVersion: 1,
      contentHash: "a".repeat(64),
      payload: {
        hand: { closed: [], exposed: [] },
        jikaze: 27,
        bakaze: 27,
        doraMarkers: [],
        riichi: null,
      },
      source: "web",
    })
    .returning();
  if (!row) throw new Error("Missing fixture");
  return row.id;
}

describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "分類属性の保存契約（PostgreSQL）",
  () => {
    beforeAll(testDb.setup);
    afterAll(testDb.close);
    beforeEach(async () => {
      await testDb.clear([
        "daily_problem_answers",
        "daily_problems",
        "practice_problems",
      ]);
    });

    it("同じ待ちのツモ・役なしのロンを区別し、盤面の削除で属性も消える", async () => {
      const problemId = await createProblem();
      await testDb.db().transaction(async (tx) => {
        await tx
          .insert(practiceProblemFacetSets)
          .values({ ...parent, problemId });
        await tx.insert(practiceProblemFacets).values({ ...child, problemId });
        await tx.insert(practiceProblemFacets).values({
          problemId,
          scoringVersion: 1,
          agariHai: 0,
          isTsumo: false,
          result: "noYaku",
        });
      });
      expect(
        await testDb.db().select().from(practiceProblemFacets),
      ).toHaveLength(2);
      await testDb
        .db()
        .delete(practiceProblems)
        .where(eq(practiceProblems.id, problemId));
      expect(
        await testDb.db().select().from(practiceProblemFacetSets),
      ).toHaveLength(0);
      expect(
        await testDb.db().select().from(practiceProblemFacets),
      ).toHaveLength(0);
    });

    it("別の版の親へ子を紐付けられず、役なしに採点値を持たせられない", async () => {
      const problemId = await createProblem();
      await testDb
        .db()
        .insert(practiceProblemFacetSets)
        .values({ ...parent, problemId });
      await expect(
        testDb
          .db()
          .insert(practiceProblemFacets)
          .values({ ...child, problemId, scoringVersion: 2 }),
      ).rejects.toMatchObject({ cause: { code: "23503" } });
      await expect(
        testDb
          .db()
          .insert(practiceProblemFacets)
          .values({ ...child, problemId, result: "noYaku", isTsumo: false }),
      ).rejects.toMatchObject({ cause: { code: "23514" } });
      await expect(
        testDb
          .db()
          .insert(practiceProblemFacets)
          .values({ ...child, problemId, fu: null }),
      ).rejects.toMatchObject({ cause: { code: "23514" } });
    });

    it("計算失敗は理由だけを持ち、成功の属性と混ざらない", async () => {
      const problemId = await createProblem();
      await testDb.db().insert(practiceProblemFacetSets).values({
        problemId,
        scoringVersion: 1,
        status: "failed",
        error: "invalidHand",
      });
      await expect(
        testDb
          .db()
          .insert(practiceProblemFacetSets)
          .values({
            ...parent,
            problemId,
            scoringVersion: 2,
            status: "failed",
            error: "invalidHand",
          }),
      ).rejects.toMatchObject({ cause: { code: "23514" } });
    });

    it("日次に使用した盤面の削除は禁止されたまま", async () => {
      const problemId = await createProblem();
      await testDb
        .db()
        .insert(dailyProblems)
        .values({ day: "2026-11-22", problemId });
      await expect(
        testDb
          .db()
          .delete(practiceProblems)
          .where(eq(practiceProblems.id, problemId)),
      ).rejects.toMatchObject({ cause: { code: "23503" } });
    });

    it("属性の2表はRLS有効・ポリシーなしで作られる", async () => {
      const client = testDb.connect();
      const rows =
        await client`SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ${testDb.namespace} AND c.relname IN ('practice_problem_facets', 'practice_problem_facet_sets')`;
      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.relrowsecurity === true)).toBe(true);
      const policies =
        await client`SELECT * FROM pg_policies WHERE schemaname = ${testDb.namespace}`;
      expect(policies).toHaveLength(0);
    });
  },
);
