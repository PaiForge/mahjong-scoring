// @vitest-environment node
import { randomUUID } from "node:crypto";

import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { ProblemReportRequest } from "@mahjong-scoring/features/problem-reports/problem-report";
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { mockNotify } = vi.hoisted(() => ({ mockNotify: vi.fn() }));

vi.mock("../db", async () => {
  const { problemReportsTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? problemReportsTestDb()
      : undefined,
  };
});
vi.mock("./notify", () => ({ notifyOperatorOfProblemReport: mockNotify }));

import {
  accountDeletions,
  practiceProblems,
  problemReports,
  type NewProblemReport,
} from "../db/schema";
import { archivePracticeProblem } from "../practice-problems/archive";
import {
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "../practice-problems/test-requests";

import {
  createProblemReport,
  PROBLEM_REPORT_DAILY_LIMIT,
} from "./create-problem-report";
import { ProblemReportStatus } from "./status";
import {
  clearProblemReportsTestDb,
  closeProblemReportsTestDb,
  hasProblemReportsClientRole,
  problemReportsTestDb,
  readProblemReportsAsClient,
  setupProblemReportsTestDb,
} from "./test-database";

const url = process.env.BILLING_TEST_DATABASE_URL;

const REPORTER = "11111111-1111-4111-8111-111111111111";
const OTHER_REPORTER = "22222222-2222-4222-8222-222222222222";

/**
 * 報告の本文（既定は和了形の点数計算で正解を見た後の「点数が違う」）
 *
 * 信頼しない入力として組むので、型の外の値も入れられるようにして最後に型を付ける。
 */
function reportRequest(
  overrides: { readonly [K in keyof ProblemReportRequest]?: unknown } = {},
): ProblemReportRequest {
  return {
    problem: meldedAgariRequest(),
    context: "agari-score",
    stage: "revealed",
    ruleSettings: DEFAULT_RULE_SETTINGS,
    reason: "wrong_score",
    detail: "",
    ...overrides,
  } as unknown as ProblemReportRequest;
}

/** 保存された報告 */
async function reports() {
  return problemReportsTestDb().select().from(problemReports);
}

/** 保存された問題 */
async function problems() {
  return problemReportsTestDb().select().from(practiceProblems);
}

/** 報告の行を直接入れる（上限と「他の未対応」の前提を作る） */
async function insertReport(
  row: Pick<NewProblemReport, "problemId" | "reporterId"> &
    Partial<NewProblemReport>,
) {
  await problemReportsTestDb()
    .insert(problemReports)
    .values({
      reason: "other",
      detail: "前提",
      context: "agari-score",
      stage: "revealed",
      snapshot: {
        ruleSettings: DEFAULT_RULE_SETTINGS,
        revision: null,
        answer: { rebuildError: "invalidHand" },
      },
      source: "web",
      ...row,
    });
}

/** 和了形の盤面を保存して、その行の ID を返す */
async function archivedAgariId(): Promise<string> {
  await archivePracticeProblem(meldedAgariRequest(), "web");
  const [problem] = await problems();
  if (!problem) throw new Error("practice problem was not archived");
  return problem.id;
}

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)("問題の報告の受付（PostgreSQL）", () => {
  beforeAll(setupProblemReportsTestDb);
  afterAll(closeProblemReportsTestDb);
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    await clearProblemReportsTestDb();
  });

  it("作成直後から、GRANT が残っていてもクライアントには報告を読ませない", async ({
    skip,
  }) => {
    if (!(await hasProblemReportsClientRole())) skip();
    await createProblemReport(REPORTER, reportRequest(), "web");

    expect(await reports()).toHaveLength(1);
    expect(await readProblemReportsAsClient()).toHaveLength(0);
  });

  it("出題時に取りこぼした盤面はその場で保存し、報告をその行に結んで運営者に 1 通知らせる", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");

    const result = await createProblemReport(
      REPORTER,
      reportRequest({ detail: "  8000 点では？  " }),
      "web",
    );

    expect(result).toBe("done");
    const [problem] = await problems();
    const saved = await reports();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      problemId: problem?.id,
      reporterId: REPORTER,
      reason: "wrong_score",
      detail: "8000 点では？",
      context: "agari-score",
      stage: "revealed",
      source: "web",
      status: ProblemReportStatus.Open,
    });
    expect(saved[0]?.snapshot).toMatchObject({
      ruleSettings: DEFAULT_RULE_SETTINGS,
      revision: "abc123",
      answer: { kind: "agari-score", score: { fu: expect.any(Number) } },
    });
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith({
      reportId: saved[0]?.id,
      reason: "wrong_score",
      detail: "8000 点では？",
      context: "agari-score",
    });
  });

  it("出題時に保存済みの盤面への報告は、既存の行に結ぶ（問題の行を増やさない）", async () => {
    const problemId = await archivedAgariId();

    await createProblemReport(REPORTER, reportRequest(), "web");

    expect(await problems()).toHaveLength(1);
    expect((await reports())[0]?.problemId).toBe(problemId);
  });

  it("本日の問題（和了形）と聴牌形の待ちの報告も受け付ける", async () => {
    expect(
      await createProblemReport(
        REPORTER,
        reportRequest({ context: "daily-problem" }),
        "web",
      ),
    ).toBe("done");
    expect(
      await createProblemReport(
        REPORTER,
        reportRequest({
          problem: riichiTenpaiRequest(),
          context: "tenpai-score",
          stage: "machiRevealed",
          reason: "wrong_machi",
        }),
        "web",
      ),
    ).toBe("done");

    const saved = await reports();
    expect(saved.map((row) => row.context).sort()).toEqual([
      "daily-problem",
      "tenpai-score",
    ]);
    const tenpai = saved.find((row) => row.context === "tenpai-score");
    expect(tenpai?.snapshot.answer).toMatchObject({ kind: "tenpai-score" });
  });

  it.each([
    ["盤面が検証を通らない", { problem: { kind: "agari-score" } }],
    ["画面が定数に無い", { context: "yaku-han" }],
    ["段階が定数に無い", { stage: "finished" }],
    [
      "本日の問題に聴牌形の盤面",
      {
        problem: riichiTenpaiRequest(),
        context: "daily-problem",
      },
    ],
    [
      "和了形の画面に聴牌形の盤面",
      {
        problem: riichiTenpaiRequest(),
        context: "agari-score",
      },
    ],
    [
      "ルール設定に余分なキーがある",
      {
        ruleSettings: { ...DEFAULT_RULE_SETTINGS, extra: true },
      },
    ],
    [
      "ルール設定のキーが欠けている",
      {
        ruleSettings: { ...DEFAULT_RULE_SETTINGS, fukugouYakuman: undefined },
      },
    ],
    [
      "ルール設定が真偽値でない",
      {
        ruleSettings: { ...DEFAULT_RULE_SETTINGS, kiriageMangan: "yes" },
      },
    ],
    ["正解を見る前に「点数が違う」", { stage: "answering" }],
    ["和了形に「待ち牌が違う」", { reason: "wrong_machi" }],
    ["理由が定数に無い", { reason: "boring" }],
  ])(
    "%s要求は invalidRequest で、盤面も報告も保存せず知らせない",
    async (_name, overrides) => {
      expect(
        await createProblemReport(REPORTER, reportRequest(overrides), "web"),
      ).toBe("invalidRequest");

      expect(await problems()).toHaveLength(0);
      expect(await reports()).toHaveLength(0);
      expect(mockNotify).not.toHaveBeenCalled();
    },
  );

  it("同じ人が同じ問題を重ねて報告しても、並行しても、行もメールも 1 つで、どれも done", async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        createProblemReport(REPORTER, reportRequest(), "web"),
      ),
    );
    const resent = await createProblemReport(
      REPORTER,
      reportRequest({ reason: "wrong_fu" }),
      "web",
    );

    expect([...results, resent].every((result) => result === "done")).toBe(
      true,
    );
    expect(await reports()).toHaveLength(1);
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it("閉じた後に同じ人が同じ問題を報告し直すと、新しい未対応として受け付けて知らせる", async () => {
    const problemId = await archivedAgariId();
    await insertReport({
      problemId,
      reporterId: REPORTER,
      status: ProblemReportStatus.Dismissed,
    });

    await createProblemReport(REPORTER, reportRequest(), "web");

    expect(await reports()).toHaveLength(2);
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it("その問題に他の人の未対応の報告があれば、行は入れるがメールは送らない", async () => {
    const problemId = await archivedAgariId();
    await insertReport({ problemId, reporterId: OTHER_REPORTER });

    expect(await createProblemReport(REPORTER, reportRequest(), "web")).toBe(
      "done",
    );

    expect(await reports()).toHaveLength(2);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("他の人の報告が閉じていれば、メールを送る", async () => {
    const problemId = await archivedAgariId();
    await insertReport({
      problemId,
      reporterId: OTHER_REPORTER,
      status: ProblemReportStatus.Resolved,
    });

    await createProblemReport(REPORTER, reportRequest(), "web");

    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it(`直近 24 時間に ${PROBLEM_REPORT_DAILY_LIMIT} 件（閉じたものを含む）報告した人は dailyLimit で、盤面も保存しない`, async () => {
    const problemId = await archivedAgariId();
    for (let index = 0; index < PROBLEM_REPORT_DAILY_LIMIT; index++) {
      await insertReport({
        problemId,
        reporterId: REPORTER,
        status: ProblemReportStatus.Resolved,
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      });
    }

    const result = await createProblemReport(
      REPORTER,
      reportRequest({
        problem: riichiTenpaiRequest(),
        context: "tenpai-score",
        reason: "invalid_board",
      }),
      "web",
    );

    expect(result).toBe("dailyLimit");
    expect(await problems()).toHaveLength(1);
    expect(await reports()).toHaveLength(PROBLEM_REPORT_DAILY_LIMIT);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("上限は 24 時間より前の報告と他の人の報告を数えない", async () => {
    const problemId = await archivedAgariId();
    for (let index = 0; index < PROBLEM_REPORT_DAILY_LIMIT; index++) {
      await insertReport({
        problemId,
        reporterId: REPORTER,
        status: ProblemReportStatus.Resolved,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      });
      await insertReport({
        problemId,
        reporterId: randomUUID(),
        status: ProblemReportStatus.Resolved,
      });
    }
    // 上限のちょうど手前（19 件）
    for (let index = 0; index < PROBLEM_REPORT_DAILY_LIMIT - 1; index++) {
      await insertReport({
        problemId,
        reporterId: REPORTER,
        status: ProblemReportStatus.Dismissed,
      });
    }

    expect(await createProblemReport(REPORTER, reportRequest(), "web")).toBe(
      "done",
    );
  });

  it("退会を受け付けた後の人の報告は accountClosing で、報告を書かず知らせない", async () => {
    await problemReportsTestDb()
      .insert(accountDeletions)
      .values({ userId: REPORTER });

    expect(await createProblemReport(REPORTER, reportRequest(), "web")).toBe(
      "accountClosing",
    );

    expect(
      await problemReportsTestDb()
        .select()
        .from(problemReports)
        .where(eq(problemReports.reporterId, REPORTER)),
    ).toHaveLength(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
