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

import { DEFAULT_RULE_SETTINGS, SCORING_VERSION } from "@mahjong-scoring/core";
import { buildDailyAnswerSnapshot } from "@mahjong-scoring/features/daily-problem/answer-receipt";
import type { DailyAnswerSnapshot } from "@mahjong-scoring/features/daily-problem/answer-snapshot";

import { logExternalError } from "@/lib/log-error";

import {
  accountDeletions,
  dailyProblemAnswers,
  dailyProblems,
} from "../db/schema";

import {
  readDailyProblemAnswer,
  recordDailyProblemAnswer,
  type DailyAnswerSubmission,
} from "./answers";
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
    it("retries distinct batches until it finds an eligible problem", async () => {
      for (let i = 0; i < 61; i++)
        await insertPracticeProblem({
          kind: "agari-score",
          payload: kiriageBoundaryAgariPayload(),
          createdAt: SAVED_YESTERDAY,
        });
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      expect(await getDailyProblem(NOW)).toBeDefined();
    });
    it("reports the bounded sample separately from exhausted inventory", async () => {
      for (let i = 0; i < 95; i++)
        await insertPracticeProblem({
          kind: "agari-score",
          payload: kiriageBoundaryAgariPayload(),
          createdAt: SAVED_YESTERDAY,
        });
      expect(await getDailyProblem(NOW)).toBeUndefined();
      expect(logExternalError).toHaveBeenCalledWith(
        "getDailyProblem",
        expect.any(String),
        { day: TODAY, examined: 90 },
      );
    });
    it("can fill both days across midnight without reusing a problem", async () => {
      for (const payload of [
        eligibleAgariPayload(),
        otherEligibleAgariPayload(),
      ])
        await insertPracticeProblem({
          kind: "agari-score",
          payload,
          createdAt: SAVED_YESTERDAY,
        });
      const results = await Promise.all([
        getDailyProblem(NOW),
        getDailyProblem(new Date("2026-11-17T15:00:00Z")),
      ]);
      expect(results.every(Boolean)).toBe(true);
      const rows = await fixedRows();
      expect(new Set(rows.map((row) => row.problemId)).size).toBe(2);
    });
    it("keeps withheld problems fixed and rejects their answers", async () => {
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await getDailyProblem(NOW);
      const before = await fixedProblemId(TODAY);
      await dailyProblemTestDb()
        .update(dailyProblems)
        .set({ withheldReason: "review" })
        .where(eq(dailyProblems.day, TODAY));
      expect(await getDailyProblem(NOW)).toBeUndefined();
      expect(
        await recordDailyProblemAnswer(randomUUID(), TODAY, true, NOW),
      ).toEqual({ kind: "staleDay" });
      expect(await fixedProblemId(TODAY)).toBe(before);
      await dailyProblemTestDb()
        .update(dailyProblems)
        .set({ withheldReason: null })
        .where(eq(dailyProblems.day, TODAY));
      expect(await getDailyProblem(NOW)).toBeDefined();
    });
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

    it("並行して選んでも、固定された行のスナップショットは固定された問題のものになる", async () => {
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "selection-sha");
      for (let i = 0; i < 6; i++)
        await insertPracticeProblem({
          kind: "agari-score",
          payload:
            i % 2 === 0 ? eligibleAgariPayload() : otherEligibleAgariPayload(),
          createdAt: SAVED_YESTERDAY,
        });

      const [first] = await Promise.all(
        Array.from({ length: 8 }, () => getDailyProblem(NOW)),
      );
      if (!first) throw new Error("problem expected");

      const rows = await fixedRows();
      expect(rows).toHaveLength(1);
      expect(rows[0].answerSnapshot).toEqual(
        buildDailyAnswerSnapshot(first.payload, "selection-sha"),
      );
      // 読み直しても選出時の値を書き換えない
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "later-sha");
      await getDailyProblem(NOW);
      expect((await fixedRows())[0].answerSnapshot?.revision).toBe(
        "selection-sha",
      );
    });

    it("ローカルで選んだ日のスナップショットはデプロイを持たない", async () => {
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
      await insertPracticeProblem({
        kind: "agari-score",
        payload: eligibleAgariPayload(),
        createdAt: SAVED_YESTERDAY,
      });
      await getDailyProblem(NOW);
      expect((await fixedRows())[0].answerSnapshot).toMatchObject({
        v: 1,
        scoringVersion: SCORING_VERSION,
        revision: null,
      });
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

    describe("詳細付きの解答", () => {
      const client = {
        scoringVersion: 1,
        build: "answer-time-build",
        ruleSettings: DEFAULT_RULE_SETTINGS,
        scoreInput: "select",
        koTsumoInput: "split",
      } as const;
      const mode = {
        requireYaku: false,
        requireHanFu: false,
        exactHan: false,
        requireFuForMangan: false,
      };
      /** 適格な盤面（子ツモ 500 / 1000）への点数だけの正答 */
      const answer = { scoreFromKo: 500, scoreFromOya: 1000, yaku: [] };
      const answered: DailyAnswerSubmission = {
        source: "ios",
        detail: { v: 1, outcome: "answered", mode, answer, client },
      };
      const gaveUp: DailyAnswerSubmission = {
        source: "web",
        detail: { v: 1, outcome: "gaveUp", mode, client },
      };

      /** 盤面を今日に固定する（スナップショットは選出を通さず直接入れる） */
      async function fixBoard(
        payload: unknown,
        answerSnapshot?: DailyAnswerSnapshot,
      ) {
        const problemId = await insertPracticeProblem({
          kind: "agari-score",
          payload,
          createdAt: SAVED_YESTERDAY,
        });
        await dailyProblemTestDb()
          .insert(dailyProblems)
          .values({ day: TODAY, problemId, answerSnapshot });
      }

      async function onlyRow() {
        const rows = await dailyProblemTestDb()
          .select()
          .from(dailyProblemAnswers);
        expect(rows).toHaveLength(1);
        return rows[0];
      }

      it("選出を通した日の解答を受付時の採点で判定し、端末の正誤とは別に残す", async () => {
        vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "receipt-sha");
        await insertPracticeProblem({
          kind: "agari-score",
          payload: eligibleAgariPayload(),
          createdAt: SAVED_YESTERDAY,
        });
        await getDailyProblem(NOW);

        // 端末は不正解と表示したが、受付時の採点では正解
        expect(
          await recordDailyProblemAnswer(
            randomUUID(),
            TODAY,
            false,
            NOW,
            answered,
          ),
        ).toEqual({ kind: "recorded", answer: { isCorrect: false } });
        expect(await onlyRow()).toMatchObject({
          isCorrect: false,
          detailVersion: 1,
          outcome: "answered",
          ...mode,
          submitted: answer,
          scoreResult: "correct",
          hanResult: "notJudged",
          fuResult: "notJudged",
          yakuResult: "notJudged",
          judgedCorrect: true,
          judgeError: null,
          snapshotConsistent: true,
          scoringVersion: SCORING_VERSION,
          source: "ios",
          client,
          revision: "receipt-sha",
        });
      });

      it("誤答は欄ごとの判定を残す", async () => {
        await fixBoard(eligibleAgariPayload());
        await recordDailyProblemAnswer(randomUUID(), TODAY, true, NOW, {
          source: "android",
          detail: {
            v: 1,
            outcome: "answered",
            mode: { ...mode, requireHanFu: true, requireYaku: true },
            answer: {
              han: 5,
              scoreFromKo: 2000,
              scoreFromOya: 4000,
              yaku: ["Riichi", "MenzenTsumo"],
            },
            client,
          },
        });
        expect(await onlyRow()).toMatchObject({
          isCorrect: true,
          scoreResult: "incorrect",
          hanResult: "incorrect",
          fuResult: "incorrect",
          yakuResult: "correct",
          judgedCorrect: false,
          source: "android",
          revision: null,
        });
      });

      it("選出時の情報が無い日は一致を持たず、正解が違う日は不一致を残す", async () => {
        await fixBoard(eligibleAgariPayload());
        await recordDailyProblemAnswer(
          randomUUID(),
          TODAY,
          true,
          NOW,
          answered,
        );
        expect((await onlyRow()).snapshotConsistent).toBeNull();

        await clearDailyProblemTestDb();
        await fixBoard(
          eligibleAgariPayload(),
          buildDailyAnswerSnapshot(otherEligibleAgariPayload(), null),
        );
        await recordDailyProblemAnswer(randomUUID(), TODAY, true, NOW, gaveUp);
        expect(await onlyRow()).toMatchObject({
          outcome: "gaveUp",
          judgedCorrect: false,
          snapshotConsistent: false,
        });
      });

      it("適格な日の「わからない」は欄を判定せず、選出時の正解との一致は残す", async () => {
        await fixBoard(
          eligibleAgariPayload(),
          buildDailyAnswerSnapshot(eligibleAgariPayload(), null),
        );
        await recordDailyProblemAnswer(randomUUID(), TODAY, false, NOW, gaveUp);
        expect(await onlyRow()).toMatchObject({
          outcome: "gaveUp",
          submitted: null,
          scoreResult: null,
          hanResult: null,
          fuResult: null,
          yakuResult: null,
          judgedCorrect: false,
          judgeError: null,
          snapshotConsistent: true,
        });
      });

      it.each([
        ["解答", answered],
        ["わからない", gaveUp],
      ])(
        "受付時に不適格な盤面の%sは採点不能として残し、解いた印は付ける",
        async (_name, submission) => {
          await fixBoard(
            kiriageBoundaryAgariPayload(),
            buildDailyAnswerSnapshot(eligibleAgariPayload(), null),
          );
          const user = randomUUID();
          expect(
            await recordDailyProblemAnswer(user, TODAY, true, NOW, submission),
          ).toEqual({ kind: "recorded", answer: { isCorrect: true } });
          expect(await onlyRow()).toMatchObject({
            outcome: submission.detail.outcome,
            judgeError: "ineligible",
            scoreResult: null,
            judgedCorrect: null,
            snapshotConsistent: null,
            scoringVersion: SCORING_VERSION,
          });
        },
      );

      it("保存形式として読めない盤面・組み立てられない盤面は理由を残す", async () => {
        await fixBoard({ broken: true });
        await recordDailyProblemAnswer(
          randomUUID(),
          TODAY,
          true,
          NOW,
          answered,
        );
        expect((await onlyRow()).judgeError).toBe("invalidPayload");
      });

      it("詳細の無い要求は旧記録として残し、詳細の列を埋めない", async () => {
        await fixBoard(
          eligibleAgariPayload(),
          buildDailyAnswerSnapshot(eligibleAgariPayload(), null),
        );
        await recordDailyProblemAnswer(randomUUID(), TODAY, true, NOW);
        expect(await onlyRow()).toMatchObject({
          isCorrect: true,
          detailVersion: null,
          outcome: null,
          scoringVersion: null,
          source: null,
          client: null,
          revision: null,
          snapshotConsistent: null,
        });
      });

      it("旧記録が先に入った日は、後から詳細を送っても書き換えない", async () => {
        await fixBoard(eligibleAgariPayload());
        const user = randomUUID();
        await recordDailyProblemAnswer(user, TODAY, false, NOW);
        expect(
          await recordDailyProblemAnswer(user, TODAY, true, NOW, answered),
        ).toEqual({ kind: "recorded", answer: { isCorrect: false } });
        expect((await onlyRow()).detailVersion).toBeNull();
      });

      it("並行して同じ詳細を再送しても 1 行に収まり、最初の内容を保つ", async () => {
        await fixBoard(eligibleAgariPayload());
        const user = randomUUID();
        await Promise.all(
          Array.from({ length: 6 }, () =>
            recordDailyProblemAnswer(user, TODAY, true, NOW, answered),
          ),
        );
        expect(await onlyRow()).toMatchObject({
          judgedCorrect: true,
          client: { build: "answer-time-build" },
        });
      });

      it("日をまたいだ詳細付きの解答・退会受付済みの解答は書かない", async () => {
        await fixBoard(eligibleAgariPayload());
        expect(
          await recordDailyProblemAnswer(
            randomUUID(),
            YESTERDAY,
            true,
            NOW,
            answered,
          ),
        ).toEqual({ kind: "staleDay" });
        const deleted = randomUUID();
        await dailyProblemTestDb()
          .insert(accountDeletions)
          .values({ userId: deleted });
        expect(
          await recordDailyProblemAnswer(deleted, TODAY, true, NOW, answered),
        ).toEqual({ kind: "deleted" });
        expect(
          await dailyProblemTestDb().select().from(dailyProblemAnswers),
        ).toHaveLength(0);
      });
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
