import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuthenticateAndCheckBan,
  setupAuthorized,
} from "@/test/auth-mocks";
const { finish } = vi.hoisted(() => ({ finish: vi.fn() }));
vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/challenge/attempts", () => ({ finishAttempt: finish }));
import { submitExamResult } from "../submit-exam-result";

describe("submitExamResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthorized({ id: "owner", email: "owner@example.com" });
    finish.mockResolvedValue({ grantedRanks: ["kyu-5"] });
  });
  it("サーバーの本人IDと挑戦IDだけで結果を確定する", async () => {
    expect(await submitExamResult("attempt-id")).toEqual({
      success: true,
      grantedRanks: ["kyu-5"],
    });
    expect(finish).toHaveBeenCalledWith("owner", "attempt-id", true);
  });
  it("クライアントが追加した点数や時間を保存処理に渡さない", async () => {
    await Reflect.apply(submitExamResult, undefined, [
      "attempt-id",
      1000,
      { score: 1000, timeTaken: 0 },
    ]);
    expect(finish).toHaveBeenCalledWith("owner", "attempt-id", true);
  });
  it("未認証は書き込まない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    expect(await submitExamResult("attempt-id")).toEqual({
      success: true,
      skipped: "anonymous",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("BAN中は書き込まない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });
    expect(await submitExamResult("attempt-id")).toEqual({
      success: false,
      error: "banned",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("無効・未終了・使用済みの挑戦は成功扱いにしない", async () => {
    finish.mockResolvedValue(undefined);
    expect(await submitExamResult("invalid")).toEqual({
      success: false,
      error: "invalid_result",
    });
  });
});
