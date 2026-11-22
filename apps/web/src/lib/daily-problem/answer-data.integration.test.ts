// @vitest-environment node
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core/rules/settings";
import { dailyProblemAnswers, dailyProblems } from "../db/schema";
import {
  clearDailyProblemTestDb,
  closeDailyProblemTestDb,
  dailyProblemTestDb,
  insertPracticeProblem,
  setupDailyProblemTestDb,
} from "./test-database";

const DAY = "2026-11-22";
const metadata = {
  detailVersion: 1,
  requireYaku: false,
  requireHanFu: false,
  exactHan: false,
  requireFuForMangan: false,
  scoringVersion: 1,
  source: "web",
  client: {
    scoringVersion: 1,
    ruleSettings: DEFAULT_RULE_SETTINGS,
    scoreInput: "select",
    koTsumoInput: "combined",
  },
} as const;
const answered = {
  ...metadata,
  outcome: "answered",
  submitted: { score: 8000, yaku: [] },
  scoreResult: "correct",
  hanResult: "notJudged",
  fuResult: "notJudged",
  yakuResult: "notJudged",
  judgedCorrect: true,
  snapshotConsistent: true,
} satisfies Partial<AnswerInsert>;

type AnswerInsert = typeof dailyProblemAnswers.$inferInsert;

async function insert(values: Partial<AnswerInsert>) {
  return dailyProblemTestDb()
    .insert(dailyProblemAnswers)
    .values({ userId: randomUUID(), day: DAY, isCorrect: false, ...values })
    .returning();
}

describe.skipIf(!process.env.BILLING_TEST_DATABASE_URL)(
  "日次解答の保存状態（PostgreSQL）",
  () => {
    beforeAll(setupDailyProblemTestDb);
    afterAll(closeDailyProblemTestDb);
    beforeEach(async () => {
      await clearDailyProblemTestDb();
      const problemId = await insertPracticeProblem({
        kind: "agari-score",
        payload: {},
        createdAt: new Date(),
      });
      await dailyProblemTestDb()
        .insert(dailyProblems)
        .values({ day: DAY, problemId });
    });

    it("旧記録とサーバー判定付きの記録を、端末の正誤と独立に保存できる", async () => {
      expect((await insert({}))[0]?.detailVersion).toBeNull();
      const [row] = await insert(answered);
      expect(row?.isCorrect).toBe(false);
      expect(row?.judgedCorrect).toBe(true);
    });

    it("適格なわからないにも選出時正解との一致を残せる", async () => {
      const [row] = await insert({
        ...metadata,
        outcome: "gaveUp",
        judgedCorrect: false,
        snapshotConsistent: true,
      });
      expect(row?.snapshotConsistent).toBe(true);
      expect(row?.submitted).toBeNull();
    });

    it("解答とわからないのどちらも採点不能として保存できる", async () => {
      for (const outcome of ["answered", "gaveUp"] as const) {
        const [row] = await insert({
          ...metadata,
          outcome,
          submitted: outcome === "answered" ? { yaku: [], score: 8000 } : null,
          judgeError: "ineligible",
        });
        expect(row?.judgedCorrect).toBeNull();
        expect(row?.snapshotConsistent).toBeNull();
      }
    });

    const invalid: readonly [string, Partial<AnswerInsert>][] = [
      ["詳細の版だけ", { detailVersion: 1 }],
      ["旧記録にrevisionだけ", { revision: "x" }],
      ["未対応版", { ...answered, detailVersion: 2 }],
      ["版の欠損", { ...answered, scoringVersion: null }],
      ["版が0", { ...answered, scoringVersion: 0 }],
      ["モードの欠損", { ...answered, requireYaku: null }],
      ["端末条件の欠損", { ...answered, client: null }],
      ["解答の欠損", { ...answered, submitted: null }],
      ["総合判定の欠損", { ...answered, judgedCorrect: null }],
      ["総合判定の矛盾", { ...answered, judgedCorrect: false }],
      ["部分判定の欠損", { ...answered, hanResult: null }],
      ["問わない翻の正解扱い", { ...answered, hanResult: "correct" }],
      ["わからないに解答がある", { ...answered, outcome: "gaveUp" }],
      ["採点不能に判定がある", { ...answered, judgeError: "ineligible" }],
      ["不明な経路", { ...answered, source: "other" }],
      ["outcomeの欠損", { ...answered, outcome: null }],
    ];
    it.each(invalid)(
      "不完全・矛盾した状態を拒否する: %s",
      async (_name, values) => {
        await expect(insert(values)).rejects.toMatchObject({
          cause: { code: "23514" },
        });
      },
    );
  },
);
