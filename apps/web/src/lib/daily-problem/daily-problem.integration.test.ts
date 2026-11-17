// @vitest-environment node
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../db", async () => {
  const { dailyProblemTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? dailyProblemTestDb()
      : undefined,
  };
});
vi.mock("@/lib/log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "@/lib/log-error";

import {
  accountDeletions,
  dailyProblemAnswers,
  dailyProblems,
} from "../db/schema";

import { readDailyProblemAnswer, recordDailyProblemAnswer } from "./answers";
import {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  tenpaiPayload,
} from "./test-payloads";
import {
  clearDailyProblemTestDb,
  closeDailyProblemTestDb,
  dailyProblemTestDb,
  insertPracticeProblem,
  setupDailyProblemTestDb,
} from "./test-database";
import { getDailyProblem } from "./today";
import * as accountLocks from "../users/account-write-lock";

const url = process.env.BILLING_TEST_DATABASE_URL;

/** 2026-11-17 12:00（JST） */
const NOW = new Date("2026-11-17T03:00:00Z");
const TODAY = "2026-11-17";
const YESTERDAY = "2026-11-16";
/** 前日（JST）に保存した時刻 */
const SAVED_YESTERDAY = new Date("2026-11-16T03:00:00Z");
/** 前日（JST）の最後の 1 秒（2026-11-16 23:59:59 JST） */
const SAVED_LAST_SECOND_OF_YESTERDAY = new Date("2026-11-16T14:59:59Z");
/** 当日（JST）の 0:00 ちょうど */
const SAVED_TODAY = new Date("2026-11-16T15:00:00Z");

/** 固定された日付と問題の行 */
async function fixedRows() {
  return dailyProblemTestDb().select().from(dailyProblems);
}

/** その日に固定された問題の ID */
async function fixedProblemId(day: string): Promise<string | undefined> {
  const [row] = await dailyProblemTestDb()
    .select({ problemId: dailyProblems.problemId })
    .from(dailyProblems)
    .where(eq(dailyProblems.day, day));
  return row?.problemId;
}

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)("本日の問題（PostgreSQL）", () => {
  beforeAll(setupDailyProblemTestDb);
  afterAll(closeDailyProblemTestDb);
  beforeEach(clearDailyProblemTestDb);
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(logExternalError).mockClear();
  });

  describe("getDailyProblem", () => {
    it("同じ日に並行して何度読んでも、最初に固定された 1 行に全員が揃う", async () => {
      for (let i = 0; i < 6; i++)
        await insertPracticeProblem({
          kind: "agari-score",
          payload:
            i % 2 === 0 ? eligibleAgariPayload() : otherEligibleAgariPayload(),
          createdAt: SAVED_YESTERDAY,
        });

      const first = await Promise.all(
        Array.from({ length: 8 }, () => getDailyProblem(NOW)),
      );
      const again = await getDailyProblem(NOW);

      expect(await fixedRows()).toHaveLength(1);
      expect(first.every((problem) => problem?.day === TODAY)).toBe(true);
      for (const problem of [...first, again])
        expect(problem?.payload).toEqual(first[0]?.payload);
    });

    it("前の日までに出した問題は選ばない", async () => {
      const used = await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await dailyProblemTestDb()
        .insert(dailyProblems)
        .values({ day: YESTERDAY, problemId: used });
      const fresh = await insertPracticeProblem({
        kind: "agari-score",
        payload: otherEligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });

      expect(await getDailyProblem(NOW)).toEqual({
        day: TODAY,
        payload: otherEligibleAgariPayload(),
      });
      expect(await fixedProblemId(TODAY)).toBe(fresh);
    });

    it("今日（JST）の 0:00 以降に保存された行は選ばない（出る直前に差し込ませない）", async () => {
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_TODAY,
      });
      expect(await getDailyProblem(NOW)).toBeUndefined();

      const lastSecond = await insertPracticeProblem({
        kind: "agari-score",
        payload: otherEligibleAgariPayload(),
        createdAt: SAVED_LAST_SECOND_OF_YESTERDAY,
      });
      expect(await getDailyProblem(NOW)).toBeDefined();
      expect(await fixedProblemId(TODAY)).toBe(lastSecond);
    });

    it("聴牌形・適格でない和了形・版の違う行は選ばず、候補が無ければ問題なしで行も作らない", async () => {
      await insertPracticeProblem({
        kind: "tenpai-score",
        payload: tenpaiPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await insertPracticeProblem({
        kind: "agari-score",
        payload: kiriageBoundaryAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
        schemaVersion: 2,
      });

      expect(await getDailyProblem(NOW)).toBeUndefined();
      expect(await fixedRows()).toHaveLength(0);
    });

    it("停止スイッチが立っていれば候補があっても選ばない", async () => {
      vi.stubEnv("DAILY_PROBLEM_DISABLED", "1");
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });

      expect(await getDailyProblem(NOW)).toBeUndefined();
      expect(await fixedRows()).toHaveLength(0);
    });

    it("固定済みの盤面が現行の検証を通らなければ問題なしにしてログに残し、選び直さない", async () => {
      const stale = await insertPracticeProblem({
        kind: "agari-score",
        payload: kiriageBoundaryAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await dailyProblemTestDb()
        .insert(dailyProblems)
        .values({ day: TODAY, problemId: stale });
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });

      expect(await getDailyProblem(NOW)).toBeUndefined();
      expect(logExternalError).toHaveBeenCalledWith(
        "getDailyProblem",
        expect.any(String),
        TODAY,
      );
      expect(await fixedProblemId(TODAY)).toBe(stale);
    });
  });

  describe("recordDailyProblemAnswer", () => {
    it("does not resurrect answers after account deletion", async () => {
      await fixToday();
      const userId = randomUUID();
      await dailyProblemTestDb().insert(accountDeletions).values({ userId });
      expect(await recordDailyProblemAnswer(userId, TODAY, true, NOW)).toEqual({
        kind: "deleted",
      });
      expect(await readDailyProblemAnswer(userId, TODAY)).toBeUndefined();
    });
    it("serializes a pending answer behind deletion acceptance", async () => {
      await fixToday();
      const userId = randomUUID();
      const entered = Promise.withResolvers<void>();
      const original = accountLocks.lockAccountForWrite;
      const spy = vi
        .spyOn(accountLocks, "lockAccountForWrite")
        .mockImplementation(async (tx, id) => {
          entered.resolve();
          return original(tx, id);
        });
      let answer: ReturnType<typeof recordDailyProblemAnswer> | undefined;
      try {
        await dailyProblemTestDb().transaction(async (tx) => {
          await accountLocks.lockAccountForDeletion(tx, userId);
          answer = recordDailyProblemAnswer(userId, TODAY, true, NOW);
          await entered.promise;
          await tx.insert(accountDeletions).values({ userId });
        });
        expect(await answer).toEqual({ kind: "deleted" });
        expect(await readDailyProblemAnswer(userId, TODAY)).toBeUndefined();
      } finally {
        spy.mockRestore();
      }
    });
    it("finishes an accepted answer before deletion removes it", async () => {
      await fixToday();
      const userId = randomUUID();
      const locked = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const original = accountLocks.lockAccountForWrite;
      const spy = vi
        .spyOn(accountLocks, "lockAccountForWrite")
        .mockImplementation(async (tx, id) => {
          const allowed = await original(tx, id);
          locked.resolve();
          await release.promise;
          return allowed;
        });
      const answer = recordDailyProblemAnswer(userId, TODAY, true, NOW);
      try {
        await locked.promise;
        const deletion = dailyProblemTestDb()
          .transaction(async (tx) => {
            await accountLocks.lockAccountForDeletion(tx, userId);
            await tx.insert(accountDeletions).values({ userId });
          })
          .then(async () => {
            await dailyProblemTestDb()
              .delete(dailyProblemAnswers)
              .where(eq(dailyProblemAnswers.userId, userId));
          });
        release.resolve();
        expect(await answer).toEqual({
          kind: "recorded",
          answer: { isCorrect: true },
        });
        await deletion;
        expect(await readDailyProblemAnswer(userId, TODAY)).toBeUndefined();
      } finally {
        release.resolve();
        spy.mockRestore();
      }
    });
    it.each([
      ["2026-11-17T14:59:59.999Z", "recorded"],
      ["2026-11-17T15:00:00.000Z", "staleDay"],
    ])("cuts off answers at JST midnight: %s", async (instant, kind) => {
      await fixToday();
      expect(
        await recordDailyProblemAnswer(
          randomUUID(),
          TODAY,
          true,
          new Date(instant),
        ),
      ).toMatchObject({ kind });
    });
    it("does not write while disabled", async () => {
      await fixToday();
      vi.stubEnv("DAILY_PROBLEM_DISABLED", "1");
      const userId = randomUUID();
      expect(await recordDailyProblemAnswer(userId, TODAY, true, NOW)).toEqual({
        kind: "staleDay",
      });
      expect(await readDailyProblemAnswer(userId, TODAY)).toBeUndefined();
    });

    /** 今日の問題を固定しておく */
    async function fixToday() {
      const problemId = await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await dailyProblemTestDb()
        .insert(dailyProblems)
        .values({ day: TODAY, problemId });
    }

    it("最初の解答だけを残し、解き直して送っても記録は変わらない", async () => {
      await fixToday();
      const user = randomUUID();

      expect(await readDailyProblemAnswer(user, TODAY)).toBeUndefined();
      expect(await recordDailyProblemAnswer(user, TODAY, false, NOW)).toEqual({
        kind: "recorded",
        answer: { isCorrect: false },
      });
      expect(await recordDailyProblemAnswer(user, TODAY, true, NOW)).toEqual({
        kind: "recorded",
        answer: { isCorrect: false },
      });
      expect(await readDailyProblemAnswer(user, TODAY)).toEqual({
        isCorrect: false,
      });
    });

    it("並行して送られても 1 行に収まる", async () => {
      await fixToday();
      const user = randomUUID();

      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          recordDailyProblemAnswer(user, TODAY, i % 2 === 0, NOW),
        ),
      );

      const rows = await dailyProblemTestDb()
        .select()
        .from(dailyProblemAnswers);
      expect(rows).toHaveLength(1);
      for (const result of results)
        expect(result).toEqual({
          kind: "recorded",
          answer: { isCorrect: rows[0].isCorrect },
        });
    });

    it("日付をまたいで届いた解答・問題の無い日の解答は staleDay で記録しない", async () => {
      await fixToday();
      const user = randomUUID();

      expect(
        await recordDailyProblemAnswer(user, YESTERDAY, true, NOW),
      ).toEqual({ kind: "staleDay" });
      await clearDailyProblemTestDb();
      expect(await recordDailyProblemAnswer(user, TODAY, true, NOW)).toEqual({
        kind: "staleDay",
      });
      expect(
        await dailyProblemTestDb().select().from(dailyProblemAnswers),
      ).toHaveLength(0);
    });

    it("他の利用者の解答とは混ざらない", async () => {
      await fixToday();
      const alice = randomUUID();
      const bob = randomUUID();

      await recordDailyProblemAnswer(alice, TODAY, true, NOW);
      await recordDailyProblemAnswer(bob, TODAY, false, NOW);

      expect(await readDailyProblemAnswer(alice, TODAY)).toEqual({
        isCorrect: true,
      });
      expect(await readDailyProblemAnswer(bob, TODAY)).toEqual({
        isCorrect: false,
      });
    });
  });
});
