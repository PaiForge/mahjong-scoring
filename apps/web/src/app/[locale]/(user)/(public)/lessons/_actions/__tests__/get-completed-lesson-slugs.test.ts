import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock("../../_lib/lesson-progress", () => ({
  fetchCompletedLessonSlugs: mockFetch,
}));

const { getCompletedLessonSlugs } =
  await import("../get-completed-lesson-slugs");

describe("getCompletedLessonSlugs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("本人の完了済みを配列で返す（Server Action の戻り値として渡せる形）", async () => {
    mockFetch.mockResolvedValue(new Set(["mangan-ko-ron", "jantou-fu"]));
    const result = await getCompletedLessonSlugs();
    expect(Array.isArray(result)).toBe(true);
    expect([...result].sort()).toEqual(["jantou-fu", "mangan-ko-ron"]);
  });

  it("未認証（空集合）なら空配列", async () => {
    mockFetch.mockResolvedValue(new Set());
    expect(await getCompletedLessonSlugs()).toEqual([]);
  });
});
