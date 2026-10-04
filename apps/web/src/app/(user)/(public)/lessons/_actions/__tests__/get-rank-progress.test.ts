import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetOptionalUser, mockFetchJourneyInput } = vi.hoisted(() => ({
  mockGetOptionalUser: vi.fn(),
  mockFetchJourneyInput: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getOptionalUser: mockGetOptionalUser }));
vi.mock("../../_lib/journey-input", () => ({
  fetchJourneyInput: mockFetchJourneyInput,
}));

const { getRankProgress } = await import("../get-rank-progress");

/** 何も済んでいない本人の進み具合 */
const NO_PROGRESS = {
  readSlugs: new Set(),
  completedLessonSlugs: new Set(),
  attemptedPractices: [],
  achievedRankSlugs: [],
};

describe("getRankProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOptionalUser.mockResolvedValue({ id: "user-1" });
    mockFetchJourneyInput.mockResolvedValue(NO_PROGRESS);
  });

  it("級の行程の段ごとの済んだ数と試験の合否を返す", async () => {
    mockFetchJourneyInput.mockResolvedValue({
      ...NO_PROGRESS,
      completedLessonSlugs: new Set(["mangan-ko-ron", "yaku"]),
      attemptedPractices: [{ slug: "yaku-han", variant: "default" }],
    });

    const progress = await getRankProgress("kyu-5");

    expect(mockFetchJourneyInput).toHaveBeenCalledWith("user-1");
    expect(progress?.learn).toEqual({ done: 2, total: 5 });
    expect(progress?.practice.done).toBe(1);
    expect(progress?.examPassed).toBe(false);
  });

  it("取得済みの級は試験を合格として返す", async () => {
    mockFetchJourneyInput.mockResolvedValue({
      ...NO_PROGRESS,
      achievedRankSlugs: ["kyu-5"],
    });
    expect((await getRankProgress("kyu-5"))?.examPassed).toBe(true);
  });

  it("未認証なら進み具合を読まずに undefined", async () => {
    mockGetOptionalUser.mockResolvedValue(null);
    expect(await getRankProgress("kyu-5")).toBeUndefined();
    expect(mockFetchJourneyInput).not.toHaveBeenCalled();
  });

  it("不正な slug は認証も DB も引かずに undefined", async () => {
    expect(await getRankProgress("no-such-rank")).toBeUndefined();
    expect(mockGetOptionalUser).not.toHaveBeenCalled();
  });
});
