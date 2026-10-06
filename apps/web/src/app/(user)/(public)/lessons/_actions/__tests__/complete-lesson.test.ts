import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuthenticateAndCheckBan,
  mockInsert,
  mockRevalidatePath,
  mockFetchJourneyInput,
} = vi.hoisted(() => ({
  mockAuthenticateAndCheckBan: vi.fn(),
  mockInsert: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockFetchJourneyInput: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authenticateAndCheckBan: mockAuthenticateAndCheckBan,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
  },
}));

vi.mock("@/lib/db/schema", async () => await import("@/test/schema-mock"));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("../../_lib/journey-input", () => ({
  fetchJourneyInput: mockFetchJourneyInput,
}));

/** 何も済んでいない本人の進み具合 */
const NO_PROGRESS = {
  completedLessonSlugs: new Set(),
  attemptedPractices: [],
  achievedRankSlugs: [],
};

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import { completeLesson, completeLessons } from "../complete-lesson";

let insertChain: QueryChainMock;

beforeEach(() => {
  vi.clearAllMocks();
  insertChain = createQueryChain();
  insertChain.onConflictDoNothing.mockResolvedValue(undefined);
  mockInsert.mockReturnValue(insertChain);
  mockFetchJourneyInput.mockResolvedValue(NO_PROGRESS);
});

describe("completeLesson", () => {
  it("未知の slug は invalid_slug で拒否し、認証も DB も読まない", async () => {
    const result = await completeLesson("not-a-lesson");

    expect(result).toEqual({ success: false, error: "invalid_slug" });
    expect(mockAuthenticateAndCheckBan).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("未ログインは skipped: anonymous で、INSERT も revalidate もしない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    const result = await completeLesson("mangan-ko-ron");

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("BAN 中は banned で拒否し、INSERT も revalidate も続きの読み取りもしない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

    const result = await completeLesson("mangan-ko-ron");

    expect(result).toEqual({ success: false, error: "banned" });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockFetchJourneyInput).not.toHaveBeenCalled();
  });

  it("認証済みなら本人の id と slug で冪等に INSERT し、次の一歩を読む画面を捨てる", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });

    const result = await completeLesson("mangan-ko-ron");

    expect(result).toMatchObject({ success: true });
    expect(insertChain.values).toHaveBeenCalledWith([
      { userId: "user-123", lessonSlug: "mangan-ko-ron" },
    ]);
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dojo");
  });

  it("記録したら、本人の進み具合から次の一歩と級の進み具合を 1 回の読み取りで返す", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });
    mockFetchJourneyInput.mockResolvedValue({
      ...NO_PROGRESS,
      completedLessonSlugs: new Set(["mangan-ko-tsumo"]),
    });

    const result = await completeLesson("mangan-ko-ron");

    expect(mockFetchJourneyInput).toHaveBeenCalledTimes(1);
    expect(mockFetchJourneyInput).toHaveBeenCalledWith("user-123");
    expect(result).toEqual({
      success: true,
      followUp: {
        next: {
          kind: "lesson",
          chapterSlug: "mangan-oya-ron",
        },
        // 終えた子のロンと、先に済ませた子のツモ
        rankProgress: {
          learn: { done: 2, total: 5 },
          practice: { done: 0, total: 6 },
          examPassed: false,
        },
      },
    });
  });

  it("次の一歩を求められなくても、記録は成功として返す", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });
    mockFetchJourneyInput.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await completeLesson("mangan-ko-ron")).toEqual({ success: true });
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
  });

  it("DB が失敗したら例外をそのまま伝える（クライアントが失敗として扱う）", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });
    insertChain.onConflictDoNothing.mockRejectedValue(new Error("db down"));

    await expect(completeLesson("mangan-ko-ron")).rejects.toThrow("db down");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("completeLessons", () => {
  it("未ログインは skipped: anonymous で、INSERT しない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "unauthorized" });

    const result = await completeLessons(["mangan-ko-ron"]);

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("BAN 中は banned で拒否し、INSERT も revalidate もしない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });

    const result = await completeLessons(["mangan-ko-ron"]);

    expect(result).toEqual({ success: false, error: "banned" });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("有効な slug だけを本人の id で冪等に INSERT し、無い slug は rejected に返す", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });

    const result = await completeLessons([
      "mangan-ko-ron",
      "not-a-lesson",
      "mangan-ko-ron",
    ]);

    expect(result).toEqual({
      success: true,
      completed: ["mangan-ko-ron"],
      rejected: ["not-a-lesson"],
    });
    expect(insertChain.values).toHaveBeenCalledWith([
      { userId: "user-123", lessonSlug: "mangan-ko-ron" },
    ]);
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dojo");
  });

  it("有効な slug が 1 つも無ければ DB にも revalidate にも触らない", async () => {
    mockAuthenticateAndCheckBan.mockResolvedValue({ user: { id: "user-123" } });

    const result = await completeLessons(["not-a-lesson"]);

    expect(result).toEqual({
      success: true,
      completed: [],
      rejected: ["not-a-lesson"],
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
