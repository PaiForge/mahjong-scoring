import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuthenticateAndCheckBan,
  mockRecordDailyProblemAnswer,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockAuthenticateAndCheckBan: vi.fn(),
  mockRecordDailyProblemAnswer: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authenticateAndCheckBan: mockAuthenticateAndCheckBan,
}));

vi.mock("@/lib/daily-problem/answers", () => ({
  recordDailyProblemAnswer: mockRecordDailyProblemAnswer,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";

import { recordDailyProblemAnswerAction } from "./record-daily-problem-answer";

const USER = { id: "00000000-0000-4000-8000-000000000001" };
const DAY = "2026-11-17";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockAuthenticateAndCheckBan.mockResolvedValue({ user: USER });
  mockRecordDailyProblemAnswer.mockResolvedValue({
    kind: "recorded",
    answer: { isCorrect: true },
  });
});

describe("recordDailyProblemAnswerAction", () => {
  it("does not send a pending answer under a different account", async () => {
    expect(
      await recordDailyProblemAnswerAction({
        day: DAY,
        isCorrect: false,
        userId: "another-user",
      }),
    ).toEqual({ success: true, skipped: "anonymous" });
    expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
  });
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
      undefined,
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

  describe("解答の詳細", () => {
    const detail = {
      v: 1,
      outcome: "gaveUp",
      mode: {
        requireYaku: false,
        requireHanFu: true,
        exactHan: false,
        requireFuForMangan: false,
      },
      client: {
        scoringVersion: 1,
        build: "dpl_answer_time",
        ruleSettings: DEFAULT_RULE_SETTINGS,
        scoreInput: "tiles",
        koTsumoInput: "combined",
      },
    };

    it("検証を通った詳細を web の由来で記録へ渡す", async () => {
      const result = await recordDailyProblemAnswerAction({
        day: DAY,
        isCorrect: false,
        detail,
      });

      expect(result).toEqual({ success: true });
      expect(mockRecordDailyProblemAnswer).toHaveBeenCalledWith(
        USER.id,
        DAY,
        false,
        expect.any(Date),
        { detail, source: "web" },
      );
    });

    it("知らない版の詳細は保存せず unsupportedDetail を返す（旧記録に落とさない）", async () => {
      const result = await recordDailyProblemAnswerAction({
        day: DAY,
        isCorrect: true,
        detail: { ...detail, v: 2 },
      });

      expect(result).toEqual({ error: "unsupportedDetail" });
      expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("形の違う詳細は保存せず invalidDetail を返す", async () => {
      const result = await recordDailyProblemAnswerAction({
        day: DAY,
        isCorrect: true,
        detail: {
          ...detail,
          client: { ...detail.client, koTsumoInput: "split" },
        },
      });

      expect(result).toEqual({ error: "invalidDetail" });
      expect(mockRecordDailyProblemAnswer).not.toHaveBeenCalled();
    });
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
