// @vitest-environment node
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";

const mocked = vi.hoisted(() => ({
  save: vi.fn(),
  grade: vi.fn(),
  ranks: vi.fn(),
}));
vi.mock("../db/save-challenge-result", () => ({
  saveChallengeResult: mocked.save,
}));
vi.mock("../db/rank-evaluation", () => ({ gradeExamRun: mocked.grade }));
vi.mock("../db/rank-queries", () => ({ getUserRankSlugs: mocked.ranks }));
vi.mock("./questions", async (original) => {
  const actual = await original<typeof import("./questions")>();
  return {
    ...actual,
    generateChallengeQuestion: () => ({
      id: "q",
      tiles: [],
      agariHai: 0,
      answer: 2,
    }),
  };
});
vi.mock("../db", async () => {
  const { challengeTestDb } = await import("./test-database");
  return {
    db: process.env.CHALLENGE_TEST_DATABASE_URL ? challengeTestDb() : undefined,
    ...(await import("../db/schema")),
  };
});
import {
  answerAttempt,
  beginAttempt,
  finishAttempt,
  pauseAttempt,
  revealExpiredAttempt,
} from "./attempts";
import { challengeTestDb, closeChallengeTestDb } from "./test-database";

const url = process.env.CHALLENGE_TEST_DATABASE_URL;
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let now = 100000;

// 明示されたローカルDBの一時テーブルだけを使う。本番・既存テーブルには触れない。
describe.skipIf(!url)("challenge transactions (PostgreSQL)", () => {
  beforeAll(async () => {
    const db = challengeTestDb();
    await db.execute(
      `CREATE TEMP TABLE challenge_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, state jsonb NOT NULL, consumed boolean NOT NULL DEFAULT false)`,
    );
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await closeChallengeTestDb();
  });
  beforeEach(async () => {
    now = 100000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    vi.clearAllMocks();
    mocked.save.mockResolvedValue({ challengeResultId: "saved" });
    mocked.grade.mockResolvedValue(["kyu-5"]);
    mocked.ranks.mockResolvedValue([]);
    await challengeTestDb().delete(schema.challengeAttempts);
  });
  async function start() {
    const attempt = await beginAttempt(owner, "machi_fu", "default", {
      renfonpaiAs4Fu: false,
    });
    expect(attempt).toBeDefined();
    if (!attempt) throw new Error("start failed");
    now += 3000;
    return attempt;
  }
  it("存在しない挑戦・他人の挑戦・旧スコア引数を拒否する", async () => {
    const attempt = await start();
    expect(await answerAttempt(other, attempt.id, 0, 2)).toBeUndefined();
    expect(await finishAttempt(other, attempt.id, false)).toBeUndefined();
    expect(await finishAttempt(owner, "machi_fu", false)).toBeUndefined();
    expect(await finishAttempt(owner, other, false)).toBeUndefined();
    expect(mocked.save).not.toHaveBeenCalled();
  });
  it("同一問題への再送・並列回答は一度しか採点しない", async () => {
    const attempt = await start();
    const results = await Promise.all([
      answerAttempt(owner, attempt.id, 0, 2),
      answerAttempt(owner, attempt.id, 0, 2),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    now += 800;
    expect(await answerAttempt(owner, attempt.id, 0, 2)).toBeUndefined();
    const [row] = await challengeTestDb()
      .select()
      .from(schema.challengeAttempts)
      .where(eq(schema.challengeAttempts.id, attempt.id));
    expect(row.state.score).toBe(1);
  });
  it("申告のcorrectやscoreでは加点せず、終了済みの実績だけ保存する", async () => {
    const attempt = await start();
    await answerAttempt(owner, attempt.id, 0, { correct: true, score: 1000 });
    now += 800;
    await answerAttempt(owner, attempt.id, 1, 2);
    expect(await finishAttempt(owner, attempt.id, false)).toBeUndefined();
    now += practiceMenuByType("machi_fu").timeLimit * 1000;
    expect(await answerAttempt(owner, attempt.id, 2, 2)).toEqual({
      expired: true,
    });
    await Promise.all([
      finishAttempt(owner, attempt.id, false),
      finishAttempt(owner, attempt.id, false),
    ]);
    expect(mocked.save).toHaveBeenCalledTimes(1);
    expect(mocked.save.mock.calls[0][0]).toMatchObject({
      userId: owner,
      score: 1,
      incorrectAnswers: 1,
      menuType: "machi_fu",
      leaderboardKey: "default",
    });
    expect(await finishAttempt(owner, attempt.id, false)).toBeUndefined();
  });
  it("計測の段階は、採点した回答と採点に進まなかった回答で分かれる", async () => {
    const attempt = await start();
    const entered: string[] = [];
    const tracker = {
      enter: (phase: string) => {
        entered.push(phase);
      },
      finish: () => {
        entered.push("finish");
      },
    };
    await answerAttempt(owner, attempt.id, 0, 2, undefined, tracker);
    expect(entered).toEqual(["lock", "grade", "update", "commit", "finish"]);
    entered.length = 0;
    // 同じ問題への再送は採点に進まず、読むだけのトランザクションを確定して終わる
    expect(
      await answerAttempt(owner, attempt.id, 0, 2, undefined, tracker),
    ).toBeUndefined();
    expect(entered).toEqual(["lock", "commit", "finish"]);
  });
  it("記録の書き込み失敗時は挑戦の消費もロールバックする", async () => {
    const attempt = await start();
    await answerAttempt(owner, attempt.id, 0, 2);
    now += 120000;
    mocked.save.mockRejectedValueOnce(new Error("write failed"));
    await expect(finishAttempt(owner, attempt.id, false)).rejects.toThrow(
      "write failed",
    );
    expect(await finishAttempt(owner, attempt.id, false)).toEqual({
      challengeResultId: "saved",
    });
  });
  it("カウントダウン・フィードバック・停止中は回答を拒否する", async () => {
    const attempt = await start();
    now -= 1000;
    expect(await answerAttempt(owner, attempt.id, 0, 2)).toBeUndefined();
    now += 1000;
    await answerAttempt(owner, attempt.id, 0, 2);
    expect(await answerAttempt(owner, attempt.id, 1, 2)).toBeUndefined();
    now += 800;
    await pauseAttempt(owner, attempt.id, true);
    now += 60000;
    expect(await answerAttempt(owner, attempt.id, 1, 2)).toBeUndefined();
    expect(await revealExpiredAttempt(owner, attempt.id)).toBeUndefined();
    await pauseAttempt(owner, attempt.id, false);
    expect(await answerAttempt(owner, attempt.id, 1, 2)).toBeDefined();
  });
  it("ミス上限到達後は正解を追加できず、練習IDで昇級できない", async () => {
    const attempt = await start();
    for (let i = 0; i < practiceMenuByType("machi_fu").mistakeLimit; i++) {
      await answerAttempt(owner, attempt.id, i, 0);
      now += 800;
    }
    expect(
      await answerAttempt(
        owner,
        attempt.id,
        practiceMenuByType("machi_fu").mistakeLimit,
        2,
      ),
    ).toBeUndefined();
    expect(await finishAttempt(owner, attempt.id, true)).toBeUndefined();
    expect(mocked.grade).not.toHaveBeenCalled();
    expect(await finishAttempt(owner, attempt.id, false)).toBeDefined();
  });
  it("出題は期限前に開示せず、期限後だけ返す", async () => {
    const attempt = await start();
    expect(await revealExpiredAttempt(owner, attempt.id)).toEqual({
      remainingMs: practiceMenuByType("machi_fu").timeLimit * 1000,
    });
    now += 120000;
    expect(await revealExpiredAttempt(owner, attempt.id)).toHaveProperty(
      "question.answer",
      2,
    );
  });
  it("受験資格のない試験や不正バリアントを開始できない", async () => {
    expect(
      await beginAttempt(owner, "pinfu_exam", "default", {
        renfonpaiAs4Fu: false,
      }),
    ).toBeUndefined();
    expect(
      await beginAttempt(owner, "score_table", "forged", {
        renfonpaiAs4Fu: false,
      }),
    ).toBeUndefined();
  });
});
