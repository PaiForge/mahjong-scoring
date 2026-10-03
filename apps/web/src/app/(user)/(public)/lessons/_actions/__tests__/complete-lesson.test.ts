import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetOptionalVerifiedUser, mockInsert, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockGetOptionalVerifiedUser: vi.fn(),
    mockInsert: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({
  getOptionalVerifiedUser: mockGetOptionalVerifiedUser,
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

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import { completeLesson, completeLessons } from "../complete-lesson";

let insertChain: QueryChainMock;

beforeEach(() => {
  vi.clearAllMocks();
  insertChain = createQueryChain();
  insertChain.onConflictDoNothing.mockResolvedValue(undefined);
  mockInsert.mockReturnValue(insertChain);
});

describe("completeLesson", () => {
  it("未知の slug は invalid_slug で拒否し、認証も DB も読まない", async () => {
    const result = await completeLesson("not-a-lesson");

    expect(result).toEqual({ success: false, error: "invalid_slug" });
    expect(mockGetOptionalVerifiedUser).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("未ログインは skipped: anonymous で、INSERT も revalidate もしない", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

    const result = await completeLesson("mangan-ko-ron");

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("認証済みなら本人の id と slug で冪等に INSERT し、次の一歩を読む画面を捨てる", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });

    const result = await completeLesson("mangan-ko-ron");

    expect(result).toEqual({ success: true });
    expect(insertChain.values).toHaveBeenCalledWith([
      { userId: "user-123", lessonSlug: "mangan-ko-ron" },
    ]);
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dojo");
  });

  it("DB が失敗したら例外をそのまま伝える（クライアントが失敗として扱う）", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });
    insertChain.onConflictDoNothing.mockRejectedValue(new Error("db down"));

    await expect(completeLesson("mangan-ko-ron")).rejects.toThrow("db down");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("completeLessons", () => {
  it("未ログインは skipped: anonymous で、INSERT しない", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

    const result = await completeLessons(["mangan-ko-ron"]);

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("有効な slug だけを本人の id で冪等に INSERT し、無い slug は rejected に返す", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });

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
    mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });

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
