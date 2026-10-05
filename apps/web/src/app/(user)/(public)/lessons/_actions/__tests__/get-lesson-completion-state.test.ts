import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock("../../_lib/lesson-progress", () => ({
  fetchCompletedLessonSlugs: mockFetch,
}));

const { getLessonCompletionState } =
  await import("../get-lesson-completion-state");

describe("getLessonCompletionState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("本人の完了済みに含まれていれば true、無ければ false", async () => {
    mockFetch.mockResolvedValue(new Set(["mangan-ko-ron"]));
    expect(await getLessonCompletionState("mangan-ko-ron")).toBe(true);
    expect(await getLessonCompletionState("mangan-ko-tsumo")).toBe(false);
  });

  it("カリキュラムに無い slug は DB を引かずに false", async () => {
    expect(await getLessonCompletionState("no-such-lesson")).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
