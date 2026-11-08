import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuthenticateAndCheckBan,
  mockIsVerifiedUserUnavailable,
  setupAuthorized,
} from "@/test/auth-mocks";
const { finish } = vi.hoisted(() => ({ finish: vi.fn() }));
vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/challenge/attempts", () => ({ finishAttempt: finish }));
import { _resetStore } from "@/lib/rate-limit-ip";
import { submitExamResult } from "../submit-exam-result";

describe("submitExamResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetStore();
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
    expect(await submitExamResult("attempt-id")).toEqual({ error: "banned" });
    expect(finish).not.toHaveBeenCalled();
  });
  it("認証サーバーが答えられなかったときは匿名にせず authUnavailable", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    mockIsVerifiedUserUnavailable.mockResolvedValue(true);
    expect(await submitExamResult("attempt-id")).toEqual({
      error: "authUnavailable",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("無効・未終了・使用済みの挑戦は成功扱いにしない", async () => {
    finish.mockResolvedValue(undefined);
    expect(await submitExamResult("invalid")).toEqual({
      error: "invalidResult",
    });
  });
  it("同じアカウントの確定が枠を超えたら挑戦に触れずに rateLimited", async () => {
    for (let i = 0; i < 60; i += 1) await submitExamResult("attempt-id");
    finish.mockClear();

    expect(await submitExamResult("attempt-id")).toEqual({
      error: "rateLimited",
    });
    expect(finish).not.toHaveBeenCalled();
  });
  it("枠は別のアカウントと共有しない", async () => {
    for (let i = 0; i < 60; i += 1) await submitExamResult("attempt-id");
    setupAuthorized({ id: "other", email: "other@example.com" });

    expect(await submitExamResult("attempt-id")).toMatchObject({
      success: true,
    });
  });
  it("未認証は枠を数えない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });
    for (let i = 0; i < 61; i += 1) await submitExamResult("attempt-id");
    setupAuthorized({ id: "owner", email: "owner@example.com" });

    expect(await submitExamResult("attempt-id")).toMatchObject({
      success: true,
    });
  });
});
