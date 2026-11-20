// @vitest-environment node
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
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

vi.mock("@/lib/db", async () => {
  const { problemReportsTestDb } =
    await import("@/lib/problem-reports/test-database");
  return {
    ...(await import("@/lib/db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? problemReportsTestDb()
      : undefined,
  };
});

import {
  practiceProblems,
  problemReports,
  type NewProblemReport,
} from "@/lib/db/schema";
import { archivePracticeProblem } from "@/lib/practice-problems/archive";
import {
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "@/lib/practice-problems/test-requests";
import {
  clearProblemReportsTestDb,
  closeProblemReportsTestDb,
  problemReportsTestDb,
  setupProblemReportsTestDb,
} from "@/lib/problem-reports/test-database";

import { closeOpenProblemReports } from "../close-problem-reports";

const url = process.env.BILLING_TEST_DATABASE_URL;

const ADMIN = "99999999-9999-4999-8999-999999999999";
const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

/** 報告の行を直接入れる */
async function insertReport(
  row: Pick<NewProblemReport, "problemId" | "reporterId"> &
    Partial<NewProblemReport>,
): Promise<string> {
  const [inserted] = await problemReportsTestDb()
    .insert(problemReports)
    .values({
      reason: "wrong_score",
      context: "agari-score",
      stage: "revealed",
      snapshot: {
        ruleSettings: DEFAULT_RULE_SETTINGS,
        revision: null,
        answer: { rebuildError: "invalidHand" },
      },
      source: "web",
      ...row,
    })
    .returning({ id: problemReports.id });
  if (!inserted) throw new Error("report was not inserted");
  return inserted.id;
}

/** 和了形と聴牌形の盤面を 1 つずつ保存し、その行の ID を返す */
async function archivedProblemIds(): Promise<{
  agari: string;
  tenpai: string;
}> {
  await archivePracticeProblem(meldedAgariRequest(), "web");
  await archivePracticeProblem(riichiTenpaiRequest(), "web");
  const rows = await problemReportsTestDb().select().from(practiceProblems);
  const agari = rows.find((r) => r.kind === "agari-score");
  const tenpai = rows.find((r) => r.kind === "tenpai-score");
  if (!agari || !tenpai) throw new Error("practice problems were not archived");
  return { agari: agari.id, tenpai: tenpai.id };
}

/** 報告 1 件の状態 */
async function reportById(id: string) {
  const [row] = await problemReportsTestDb()
    .select()
    .from(problemReports)
    .where(eq(problemReports.id, id));
  return row;
}

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)(
  "同じ問題の未対応の報告の一括クローズ（PostgreSQL）",
  () => {
    beforeAll(setupProblemReportsTestDb);
    afterAll(closeProblemReportsTestDb);
    beforeEach(clearProblemReportsTestDb);

    it("同じ問題の未対応だけを同じ状態・メモで閉じ、他の問題と閉じた報告は書き換えない", async () => {
      const { agari, tenpai } = await archivedProblemIds();
      const aliceOpen = await insertReport({
        problemId: agari,
        reporterId: ALICE,
      });
      const bobOpen = await insertReport({ problemId: agari, reporterId: BOB });
      const earlierDismissed = await insertReport({
        problemId: agari,
        reporterId: ALICE,
        status: "dismissed",
        resolutionNote: "前の判断",
        resolvedBy: BOB,
        resolvedAt: new Date("2026-11-01T00:00:00Z"),
      });
      const otherProblem = await insertReport({
        problemId: tenpai,
        reporterId: ALICE,
        context: "tenpai-score",
      });
      const now = new Date("2026-11-21T03:00:00Z");

      const closed = await problemReportsTestDb().transaction((tx) =>
        closeOpenProblemReports(tx, {
          problemId: agari,
          status: "resolved",
          note: "採点を直した",
          actorId: ADMIN,
          now,
        }),
      );

      expect(new Set(closed)).toEqual(new Set([aliceOpen, bobOpen]));
      for (const id of [aliceOpen, bobOpen]) {
        expect(await reportById(id)).toMatchObject({
          status: "resolved",
          resolutionNote: "採点を直した",
          resolvedBy: ADMIN,
          resolvedAt: now,
        });
      }
      expect(await reportById(earlierDismissed)).toMatchObject({
        status: "dismissed",
        resolutionNote: "前の判断",
        resolvedBy: BOB,
      });
      expect(await reportById(otherProblem)).toMatchObject({
        status: "open",
        resolvedBy: null,
      });
    });

    it("閉じた後は同じ人が同じ問題をもう一度報告できる（未対応の一意制約から外れる）", async () => {
      const { agari } = await archivedProblemIds();
      await insertReport({ problemId: agari, reporterId: ALICE });
      await problemReportsTestDb().transaction((tx) =>
        closeOpenProblemReports(tx, {
          problemId: agari,
          status: "dismissed",
          note: null,
          actorId: ADMIN,
          now: new Date(),
        }),
      );
      await expect(
        insertReport({ problemId: agari, reporterId: ALICE }),
      ).resolves.toEqual(expect.any(String));
    });
  },
);
