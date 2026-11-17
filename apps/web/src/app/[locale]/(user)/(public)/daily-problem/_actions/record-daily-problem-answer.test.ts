import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuthenticateAndCheckBan,
  mockIsVerifiedUserUnavailable,
  mockRecordDailyProblemAnswer,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockAuthenticateAndCheckBan: vi.fn(),
  mockIsVerifiedUserUnavailable: vi.fn(),
  mockRecordDailyProblemAnswer: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authenticateAndCheckBan: mockAuthenticateAndCheckBan,
  isVerifiedUserUnavailable: mockIsVerifiedUserUnavailable,
}));

vi.mock("@/lib/daily-problem/answers", () => ({
  recordDailyProblemAnswer: mockRecordDailyProblemAnswer,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { recordDailyProblemAnswerAction } from "./record-daily-problem-answer";

const USER = { id: "00000000-0000-4000-8000-000000000001" };
const DAY = "2026-11-17";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockIsVerifiedUserUnavailable.mockResolvedValue(false);
  mockAuthenticateAndCheckBan.mockResolvedValue({ user: USER });
  mockRecordDailyProblemAnswer.mockResolvedValue({
    kind: "recorded",
    answer: { isCorrect: true },
  });
});

describe("recordDailyProblemAnswerAction", () => {
  it("skips a deleted account after authorization", async () => {
    mockRecordDailyProblemAnswer.mockResolvedValue({ kind: "deleted" });
    expect(
      await recordDailyProblemAnswerAction({ day: DAY, isCorrect: true }),
    ).toEqual({ success: true, skipped: "anonymous" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
  it("ログイン済みの解答を本人の分として記録し、ホームのキャッシュを捨てる", async () => {
    const result = await recordDailyProblemAnswerAction({
      day: DAY,
      isCorrect: true,
    });

    expect(result).toEqual({ success: true });
    expect(mockRecordDailyProblemAnswer).toHaveBeenCalledWith(
      USER.id,
      DAY,
      true,
      expect.any(Date),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("未ログインは記録せず、期待された no-op として成功を返す", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    const result = await recordDailyProblemAnswerAction({
      day: DAY,
      isCorrect: false,
    });

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
  });

  it("BAN された利用者は記録しない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

    const result = await recordDailyProblemAnswerAction({
      day: DAY,
      isCorrect: true,
    });

    expect(result).toEqual({ error: "banned" });
    expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
  });

  it("日付をまたいで届いた解答は捨てて成功を返す（キャッシュも捨てない）", async () => {
    mockRecordDailyProblemAnswer.mockResolvedValue({ kind: "staleDay" });

    const result = await recordDailyProblemAnswerAction({
      day: "2026-11-16",
      isCorrect: true,
    });

    expect(result).toEqual({ error: "staleDay" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("DB の失敗は recordFailed で返し、例外にしない", async () => {
    mockRecordDailyProblemAnswer.mockRejectedValue(new Error("db down"));

    const result = await recordDailyProblemAnswerAction({
      day: DAY,
      isCorrect: true,
    });

    expect(result).toEqual({ error: "recordFailed" });
  });

  it.each([
    [{ day: "2026/11/17", isCorrect: true }],
    [{ day: DAY, isCorrect: "true" }],
    [undefined],
  ])("形の違う入力 %j は認証も DB も読まずに拒否する", async (input) => {
    const result = await recordDailyProblemAnswerAction(input);

    expect(result).toEqual({ error: "invalidInput" });
    expect(mockAuthenticateAndCheckBan).not.toHaveBeenCalled();
    expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
  });
});
