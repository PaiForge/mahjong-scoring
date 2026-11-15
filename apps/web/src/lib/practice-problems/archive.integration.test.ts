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

vi.mock("../db", async () => {
  const { practiceProblemsTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.PRACTICE_PROBLEMS_TEST_DATABASE_URL
      ? practiceProblemsTestDb()
      : undefined,
  };
});

import { practiceProblems } from "../db/schema";

import { archivePracticeProblem } from "./archive";
import {
  clearPracticeProblemsTestDb,
  closePracticeProblemsTestDb,
  practiceProblemsTestDb,
  setupPracticeProblemsTestDb,
} from "./test-database";
import { meldedAgariRequest, riichiTenpaiRequest } from "./test-requests";

const url = process.env.PRACTICE_PROBLEMS_TEST_DATABASE_URL;

/** 保存された行 */
async function rows() {
  return practiceProblemsTestDb().select().from(practiceProblems);
}

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)("問題の保存（PostgreSQL）", () => {
  beforeAll(setupPracticeProblemsTestDb);
  afterAll(closePracticeProblemsTestDb);
  beforeEach(clearPracticeProblemsTestDb);

  it("同じ問題を複数の接続から並行に保存しても、送り直しても 1 行に収まる", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        archivePracticeProblem(meldedAgariRequest(), "web"),
      ),
    );
    const resent = await archivePracticeProblem(meldedAgariRequest(), "ios");

    expect(results.every((result) => result.ok)).toBe(true);
    expect(resent).toEqual({ ok: true });
    const saved = await rows();
    expect(saved).toHaveLength(1);
    // 最初に届いたものが残る（後から届いた同じ盤面は何も書き換えない）
    expect(saved[0].source).toBe("web");
  });

  it("鳴き元だけ違う問題は 1 行（最初に届いた鳴き元を payload に残す）", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "web");
    await archivePracticeProblem(
      meldedAgariRequest({ ponFrom: "toimen" }),
      "web",
    );

    const saved = await rows();
    expect(saved).toHaveLength(1);
    expect(JSON.stringify(saved[0].payload)).toContain('"shimocha"');
  });

  it("副露の種別が違う問題は 2 行", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "web");
    await archivePracticeProblem(
      meldedAgariRequest({ ninePinKan: "kakan" }),
      "web",
    );

    expect(await rows()).toHaveLength(2);
  });

  it("和了形と聴牌形は別の種別として保存し、DB の CHECK を通る", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "android");
    await archivePracticeProblem(riichiTenpaiRequest(), "android");

    const saved = await rows();
    expect(saved.map((row) => row.kind).sort()).toEqual([
      "agari-score",
      "tenpai-score",
    ]);
    expect(saved.every((row) => /^[0-9a-f]{64}$/.test(row.contentHash))).toBe(
      true,
    );
  });
});
