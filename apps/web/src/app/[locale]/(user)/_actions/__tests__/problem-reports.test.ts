// @vitest-environment node
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { ProblemReportRequest } from "@mahjong-scoring/features/problem-reports/problem-report";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGuard, mockUserRateLimit, mockCreate } = vi.hoisted(() => ({
  mockGuard: vi.fn(),
  mockUserRateLimit: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/action-guard", () => ({ guardUserAction: mockGuard }));
vi.mock("@/lib/rate-limit-ip", () => ({
  enforceUserRateLimit: mockUserRateLimit,
}));
vi.mock("@/lib/problem-reports/create-problem-report", () => ({
  createProblemReport: mockCreate,
  PROBLEM_REPORT_BODY_MAX_BYTES: 4096,
}));
vi.mock("@/lib/log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "@/test/log-error-mock";

import { reportProblemAction } from "../problem-reports";

/** 報告の本文（信頼しない入力として組み、最後に型を付ける） */
function reportRequest(
  overrides: { readonly [K in keyof ProblemReportRequest]?: unknown } = {},
): ProblemReportRequest {
  return {
    problem: { kind: "agari-score", schemaVersion: 1, payload: {} },
    context: "agari-score",
    stage: "revealed",
    ruleSettings: DEFAULT_RULE_SETTINGS,
    reason: "wrong_score",
    detail: "",
    ...overrides,
  } as unknown as ProblemReportRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue({ user: { id: "u1" } });
  mockUserRateLimit.mockReturnValue(undefined);
  mockCreate.mockResolvedValue("done");
});

describe("reportProblemAction", () => {
  it("IP の枠と認証のゲート → アカウントの枠 → 受付の順に通し、web の入口として受け付ける", async () => {
    const request = reportRequest();

    expect(await reportProblemAction(request)).toEqual({ success: true });
    expect(mockGuard).toHaveBeenCalledWith("reportProblem");
    expect(mockUserRateLimit).toHaveBeenCalledWith("u1", "reportProblem");
    expect(mockCreate).toHaveBeenCalledWith("u1", request, "web");
  });

  it("ガードのエラー（未認証・BAN・IP の枠）はそのまま返し、受け付けない", async () => {
    mockGuard.mockResolvedValue({ error: "unauthorized" });

    expect(await reportProblemAction(reportRequest())).toEqual({
      error: "unauthorized",
    });
    expect(mockUserRateLimit).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("アカウントの枠を超えたら rateLimited で、受け付けない", async () => {
    mockUserRateLimit.mockReturnValue({ error: "rateLimited" });

    expect(await reportProblemAction(reportRequest())).toEqual({
      error: "rateLimited",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("本文を JSON にして 4096 バイトを超えたら invalidRequest", async () => {
    const request = reportRequest({ problem: { padding: "x".repeat(4096) } });

    expect(await reportProblemAction(request)).toEqual({
      error: "invalidRequest",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["null", null],
    ["文字列", "report"],
    ["JSON にできない値", { problem: BigInt(1) }],
  ])("本文が%sなら invalidRequest", async (_name, body) => {
    expect(
      await reportProblemAction(body as unknown as ProblemReportRequest),
    ).toEqual({ error: "invalidRequest" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["理由が定数に無い", { reason: "boring" }, "invalidReason"],
    [
      "「その他」で詳細が空",
      { reason: "other", detail: "  " },
      "detailRequired",
    ],
    ["詳細が 500 字を超える", { detail: "あ".repeat(501) }, "detailTooLong"],
  ])("%sときは入力の誤り（%s）を返す", async (_name, overrides, error) => {
    expect(await reportProblemAction(reportRequest(overrides))).toEqual({
      error,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each(["invalidRequest", "dailyLimit"] as const)(
    "受付の %s はそのまま返す",
    async (result) => {
      mockCreate.mockResolvedValue(result);

      expect(await reportProblemAction(reportRequest())).toEqual({
        error: result,
      });
    },
  );

  it("退会を受け付けた後の人には unauthorized を返す", async () => {
    mockCreate.mockResolvedValue("accountClosing");

    expect(await reportProblemAction(reportRequest())).toEqual({
      error: "unauthorized",
    });
  });

  it("DB の失敗は failed を返し、盤面・詳細を含む例外のメッセージではなくエラーコードだけを記録する", async () => {
    mockCreate.mockRejectedValue(
      Object.assign(new Error('Failed query: params: {"detail":"秘密"}'), {
        cause: Object.assign(new Error("deadlock"), { code: "40P01" }),
      }),
    );

    expect(await reportProblemAction(reportRequest())).toEqual({
      error: "failed",
    });
    expect(logExternalError).toHaveBeenCalledWith(
      "reportProblemAction",
      expect.any(String),
      "40P01",
    );
  });
});
