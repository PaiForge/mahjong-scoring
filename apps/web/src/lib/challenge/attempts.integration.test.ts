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
  readAttemptStatus,
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
    await db.execute(
      `CREATE TEMP TABLE account_deletions (user_id uuid PRIMARY KEY, requested_at timestamptz NOT NULL DEFAULT now())`,
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
    await challengeTestDb().execute(`DELETE FROM account_deletions`);
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
  it("同一問題への再送・並列回答は一度しか採点せず、同じ応答を返す", async () => {
    const attempt = await start();
    const results = await Promise.all([
      answerAttempt(owner, attempt.id, 0, 2),
      answerAttempt(owner, attempt.id, 0, 2),
    ]);
    expect(results[0]).toBeDefined();
    expect(results[1]).toEqual(results[0]);
    now += 800;
    expect(await answerAttempt(owner, attempt.id, 0, 2)).toEqual(results[0]);
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
    expect(await finishAttempt(owner, attempt.id, false)).toEqual({
      challengeResultId: "saved",
    });
    expect(mocked.save).toHaveBeenCalledTimes(1);
  });
  it("直前の問題へ別の回答を送り直しても受け付けない", async () => {
    const attempt = await start();
    const first = await answerAttempt(owner, attempt.id, 0, 0);
    expect(first).toMatchObject({ correct: false, sequence: 1 });
    expect(await answerAttempt(owner, attempt.id, 0, 2)).toBeUndefined();
    // 値が undefined のキーは jsonb に残らないが、同じ回答として扱う
    now += 800;
    const keyed = await answerAttempt(owner, attempt.id, 1, { fu: 2 });
    expect(
      await answerAttempt(owner, attempt.id, 1, { fu: 2, note: undefined }),
    ).toEqual(keyed);
  });
  it("確定済みの試験への再送は、判定し直さずに同じ付与結果を返す", async () => {
    const attempt = await beginAttempt(owner, "mangan_exam", "default", {
      renfonpaiAs4Fu: false,
    });
    if (!attempt) throw new Error("start failed");
    now += 3000 + 120000;
    const first = await finishAttempt(owner, attempt.id, true);
    expect(first).toEqual({ grantedRanks: ["kyu-5"] });
    expect(await finishAttempt(owner, attempt.id, true)).toEqual(first);
    expect(mocked.grade).toHaveBeenCalledTimes(1);
  });
  it("呼び出し側の ID で開始すると、再送は同じ挑戦を返す", async () => {
    const id = "33333333-3333-4333-8333-333333333333";
    const begin = () =>
      beginAttempt(owner, "machi_fu", "default", { renfonpaiAs4Fu: false }, id);
    const [a, b] = await Promise.all([begin(), begin()]);
    expect(a).toMatchObject({ id, sequence: 0 });
    expect(b).toEqual(a);
    now += 3000;
    await answerAttempt(owner, id, 0, 2);
    expect(await begin()).toMatchObject({ id, sequence: 1 });
    const rows = await challengeTestDb()
      .select()
      .from(schema.challengeAttempts);
    expect(rows).toHaveLength(1);
  });
  it("他人の挑戦 ID・別の練習や別の設定の ID では開始しない", async () => {
    const id = "44444444-4444-4444-8444-444444444444";
    const settings = { renfonpaiAs4Fu: false };
    await beginAttempt(owner, "machi_fu", "default", settings, id);
    expect(
      await beginAttempt(other, "machi_fu", "default", settings, id),
    ).toBeUndefined();
    expect(
      await beginAttempt(owner, "jantou_fu", "default", settings, id),
    ).toBeUndefined();
    // 同じ ID でルール設定だけ違う要求も再送ではなく競合
    expect(
      await beginAttempt(
        owner,
        "machi_fu",
        "default",
        { renfonpaiAs4Fu: true },
        id,
      ),
    ).toBeUndefined();
    expect(
      await beginAttempt(owner, "machi_fu", "default", settings, "not-a-uuid"),
    ).toBeUndefined();
  });
  it("挑戦の状態は本人にだけ、正解を伏せて返す", async () => {
    const attempt = await start();
    await answerAttempt(owner, attempt.id, 0, 2);
    now += 1000;
    const status = await readAttemptStatus(owner, attempt.id);
    expect(status).toMatchObject({
      id: attempt.id,
      menuType: "machi_fu",
      settings: { renfonpaiAs4Fu: false },
      sequence: 1,
      score: 1,
      incorrectAnswers: 0,
      paused: false,
      finished: false,
    });
    expect(status?.question).not.toHaveProperty("answer", 2);
    expect(await readAttemptStatus(other, attempt.id)).toBeUndefined();
    now += 120000;
    await finishAttempt(owner, attempt.id, false);
    expect(await readAttemptStatus(owner, attempt.id)).toMatchObject({
      finished: true,
      outcome: { challengeResultId: "saved" },
    });
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
  it("退会を受け付けた後は、挑戦を始めることも成績を確定することもできない", async () => {
    const attempt = await start();
    await answerAttempt(owner, attempt.id, 0, 2);
    now += 120000;
    await challengeTestDb().execute(
      `INSERT INTO account_deletions (user_id) VALUES ('${owner}')`,
    );
    expect(await finishAttempt(owner, attempt.id, false)).toBeUndefined();
    expect(mocked.save).not.toHaveBeenCalled();
    expect(
      await beginAttempt(owner, "machi_fu", "default", {
        renfonpaiAs4Fu: false,
      }),
    ).toBeUndefined();
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
