import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  getUserRankSlugs: vi.fn(),
  fetchReadChapterSlugs: vi.fn(),
  fetchCompletedLessonSlugs: vi.fn(),
  fetchAttemptedPractices: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getOptionalUser: mocks.getOptionalUser }));
vi.mock("@/lib/db/rank-queries", () => ({
  getUserRankSlugs: mocks.getUserRankSlugs,
}));
vi.mock("@/app/(user)/(public)/learn/_lib/progress", () => ({
  fetchReadChapterSlugs: mocks.fetchReadChapterSlugs,
}));
vi.mock("@/app/(user)/(public)/dashboard/_lib/attempted-practices", () => ({
  fetchAttemptedPractices: mocks.fetchAttemptedPractices,
}));
vi.mock("../../_lib/progress", () => ({
  fetchCompletedLessonSlugs: mocks.fetchCompletedLessonSlugs,
}));

const { getRankProgress } = await import("../get-rank-progress");

describe("getRankProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOptionalUser.mockResolvedValue({ id: "user-1" });
    mocks.getUserRankSlugs.mockResolvedValue([]);
    mocks.fetchReadChapterSlugs.mockResolvedValue(new Set());
    mocks.fetchCompletedLessonSlugs.mockResolvedValue(new Set());
    mocks.fetchAttemptedPractices.mockResolvedValue([]);
  });

  it("級の行程の段ごとの済んだ数と試験の合否を返す", async () => {
    mocks.fetchCompletedLessonSlugs.mockResolvedValue(
      new Set(["mangan-ko-ron", "yaku"]),
    );
    mocks.fetchAttemptedPractices.mockResolvedValue([
      { slug: "yaku-han", variant: "default" },
    ]);

    const progress = await getRankProgress("kyu-5");

    expect(progress?.learn).toEqual({ done: 2, total: 5 });
    expect(progress?.practice.done).toBe(1);
    expect(progress?.examPassed).toBe(false);
  });

  it("取得済みの級は試験を合格として返す", async () => {
    mocks.getUserRankSlugs.mockResolvedValue(["kyu-5"]);
    expect((await getRankProgress("kyu-5"))?.examPassed).toBe(true);
  });

  it("未認証なら undefined", async () => {
    mocks.getOptionalUser.mockResolvedValue(null);
    expect(await getRankProgress("kyu-5")).toBeUndefined();
  });

  it("不正な slug は認証も DB も引かずに undefined", async () => {
    expect(await getRankProgress("no-such-rank")).toBeUndefined();
    expect(mocks.getOptionalUser).not.toHaveBeenCalled();
  });
});
