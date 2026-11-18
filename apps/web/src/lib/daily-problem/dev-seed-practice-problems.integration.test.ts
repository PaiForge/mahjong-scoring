// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../db", async () => {
  const { dailyProblemTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? dailyProblemTestDb()
      : undefined,
  };
});

import {
  closeDailyProblemTestDb,
  dailyProblemTestDb,
  setupDailyProblemTestDb,
} from "./test-database";
import { getDailyProblem } from "./today";
import { practiceProblems } from "../db/schema";

import {
  SEED_DAILY_PROBLEMS,
  seedPracticeProblems,
} from "../../../scripts/dev-seed/practice-problems";

const url = process.env.BILLING_TEST_DATABASE_URL;

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)("開発用シードの保存問題（PostgreSQL）", () => {
  beforeAll(setupDailyProblemTestDb);
  afterAll(closeDailyProblemTestDb);

  it("何度入れても 1 盤面 1 行で、入れた直後から本日の問題が出る", async () => {
    const now = new Date();
    await seedPracticeProblems(dailyProblemTestDb(), now);
    await seedPracticeProblems(dailyProblemTestDb(), now);

    const rows = await dailyProblemTestDb().select().from(practiceProblems);
    expect(rows).toHaveLength(SEED_DAILY_PROBLEMS.length);
    expect(await getDailyProblem(now)).toBeDefined();
  });
});
