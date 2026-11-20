// @vitest-environment node
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryChain } from "@/test/drizzle-mock";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../../../_lib/auth", () => ({ requireAdminActor: mocks.actor }));
vi.mock("@/lib/db", async () => ({
  ...(await import("@/lib/db/schema")),
  db: { transaction: mocks.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));

import { moderationActions, problemReports } from "@/lib/db/schema";

import { closeProblemReportAction } from "../problem-report-actions";

const REPORT_ID = "11111111-1111-4111-8111-111111111111";
const PROBLEM_ID = "22222222-2222-4222-8222-222222222222";

/** 報告の読み出し・一括更新・監査ログの書き込みを受けるトランザクション */
function stubTransaction(found: readonly { problemId: string }[]) {
  const select = createQueryChain(found);
  const update = createQueryChain([
    { id: REPORT_ID },
    { id: "33333333-3333-4333-8333-333333333333" },
  ]);
  const insert = createQueryChain([]);
  const tx = {
    select: select.select,
    update: update.update,
    insert: insert.insert,
  };
  mocks.transaction.mockImplementation((body) => body(tx));
  return { select, update, insert };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ actorId: "admin", ipAddress: "127.0.0.1" });
});

describe("closeProblemReportAction", () => {
  it("管理者でなければ読みも書きもしない", async () => {
    mocks.actor.mockResolvedValue({ error: "unauthorized" });
    expect(await closeProblemReportAction(REPORT_ID, "resolved", "")).toEqual({
      error: "unauthorized",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it.each([
    ["not-a-uuid", "resolved", ""],
    // 未対応へ戻す操作は無い
    [REPORT_ID, "open", ""],
    [REPORT_ID, "resolved", "x".repeat(1001)],
  ])("不正な入力は書かずに弾く: %s / %s", async (id, status, note) => {
    // クライアントから届く値は型の外もありうる
    expect(
      await closeProblemReportAction(id, status as "resolved", note),
    ).toEqual({ error: "invalidInput" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each(["resolved", "dismissed"] as const)(
    "同じ問題の未対応の報告をまとめて同じ状態・メモで閉じ、監査ログに残す: %s",
    async (status) => {
      const { select, update, insert } = stubTransaction([
        { problemId: PROBLEM_ID },
      ]);
      expect(
        await closeProblemReportAction(REPORT_ID, status, "  採点を直した  "),
      ).toEqual({ success: true });

      // 押した報告は未対応のものだけをロックして読む
      expect(select.where).toHaveBeenCalledWith(
        and(
          eq(problemReports.id, REPORT_ID),
          eq(problemReports.status, "open"),
        ),
      );
      expect(select.for).toHaveBeenCalledWith("update");
      // 更新は押した 1 件ではなく、同じ問題の未対応すべて
      expect(update.update).toHaveBeenCalledWith(problemReports);
      expect(update.where).toHaveBeenCalledWith(
        and(
          eq(problemReports.problemId, PROBLEM_ID),
          eq(problemReports.status, "open"),
        ),
      );
      expect(update.set).toHaveBeenCalledWith({
        status,
        resolutionNote: "採点を直した",
        resolvedBy: "admin",
        resolvedAt: expect.any(Date),
      });
      expect(insert.insert).toHaveBeenCalledWith(moderationActions);
      expect(insert.values).toHaveBeenCalledWith({
        actorId: "admin",
        action: "close_problem_report",
        targetType: "practice_problem",
        targetKey: PROBLEM_ID,
        ipAddress: "127.0.0.1",
        metadata: {
          reportId: REPORT_ID,
          reportIds: [REPORT_ID, "33333333-3333-4333-8333-333333333333"],
          status,
          note: "採点を直した",
        },
      });
      expect(mocks.revalidate).toHaveBeenCalledWith(
        "/admin/problem-reports",
        "layout",
      );
    },
  );

  it("メモが空白だけなら null で閉じる", async () => {
    const { update } = stubTransaction([{ problemId: PROBLEM_ID }]);
    await closeProblemReportAction(REPORT_ID, "dismissed", "   ");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ resolutionNote: null }),
    );
  });

  it("押した報告が未対応でなければ（先に閉じられていれば）何も書かない", async () => {
    const { update, insert } = stubTransaction([]);
    expect(await closeProblemReportAction(REPORT_ID, "resolved", "")).toEqual({
      error: "notFound",
    });
    expect(update.update).not.toHaveBeenCalled();
    expect(insert.insert).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("トランザクションが失敗したら閉じずに失敗を返す", async () => {
    mocks.transaction.mockRejectedValue(new Error("audit unavailable"));
    expect(await closeProblemReportAction(REPORT_ID, "resolved", "")).toEqual({
      error: "failed",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
