import { beforeEach, describe, expect, it, vi } from "vitest";
const { auth, finish } = vi.hoisted(() => ({ auth: vi.fn(), finish: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authenticateAndCheckBan: auth }));
vi.mock("@/lib/challenge/attempts", () => ({ finishAttempt: finish }));
import { savePracticeResult } from "../save-practice-result";

describe("savePracticeResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "owner" } });
    finish.mockResolvedValue({ challengeResultId: "result-id" });
  });
  it("サーバーの本人IDと挑戦IDだけで結果を確定する", async () => {
    expect(await savePracticeResult("attempt-id")).toEqual({
      success: true,
      challengeResultId: "result-id",
    });
    expect(finish).toHaveBeenCalledWith("owner", "attempt-id", false);
  });
  it("クライアントが追加した点数や時間を保存処理に渡さない", async () => {
    await Reflect.apply(savePracticeResult, undefined, [
      "attempt-id",
      1000,
      { score: 1000, timeTaken: 0 },
    ]);
    expect(finish).toHaveBeenCalledWith("owner", "attempt-id", false);
  });
  it("未認証は書き込まない", async () => {
    auth.mockResolvedValue({ error: "unauthorized" });
    expect(await savePracticeResult("attempt-id")).toEqual({
      success: true,
      skipped: "anonymous",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("BAN中は書き込まない", async () => {
    auth.mockResolvedValue({ error: "banned" });
    expect(await savePracticeResult("attempt-id")).toEqual({
      success: false,
      error: "banned",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("無効・未終了・使用済みの挑戦は成功扱いにしない", async () => {
    finish.mockResolvedValue(undefined);
    expect(await savePracticeResult("invalid")).toEqual({
      success: false,
      error: "invalid_result",
    });
  });
});
