import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAllTimeRanking,
  mockGetMonthlyRanking,
  mockGetUserAllTimeRankedRow,
  mockGetUserMonthlyRankedRow,
} = vi.hoisted(() => ({
  mockGetAllTimeRanking: vi.fn(),
  mockGetMonthlyRanking: vi.fn(),
  mockGetUserAllTimeRankedRow: vi.fn(),
  mockGetUserMonthlyRankedRow: vi.fn(),
}));

vi.mock("../../db/leaderboard-queries", () => ({
  getAllTimeRanking: mockGetAllTimeRanking,
  getMonthlyRanking: mockGetMonthlyRanking,
}));

vi.mock("../../db/user-rank-queries", () => ({
  getUserAllTimeRankedRow: mockGetUserAllTimeRankedRow,
  getUserMonthlyRankedRow: mockGetUserMonthlyRankedRow,
}));

import { getQueriesForPeriod } from "../period-queries";

const NOW = new Date("2026-08-15T12:00:00.000Z");

describe("getQueriesForPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("all-time period", () => {
    it("returns getAllTimeRanking as getRanking", () => {
      const queries = getQueriesForPeriod("all-time", NOW);
      expect(queries.getRanking).toBe(mockGetAllTimeRanking);
    });

    it("returns getUserAllTimeRankedRow as getUserRankedRow", () => {
      const queries = getQueriesForPeriod("all-time", NOW);
      expect(queries.getUserRankedRow).toBe(mockGetUserAllTimeRankedRow);
    });
  });

  describe("monthly period", () => {
    it("delegates getRanking to getMonthlyRanking with the bound now", () => {
      const { getRanking } = getQueriesForPeriod("monthly", NOW);

      void getRanking("jantou_fu", "default", 0, 20);

      expect(mockGetMonthlyRanking).toHaveBeenCalledWith(
        "jantou_fu",
        "default",
        0,
        20,
        NOW,
      );
    });

    it("delegates getUserRankedRow to getUserMonthlyRankedRow with the bound now", () => {
      const { getUserRankedRow } = getQueriesForPeriod("monthly", NOW);

      void getUserRankedRow("user-a", "jantou_fu", "default");

      expect(mockGetUserMonthlyRankedRow).toHaveBeenCalledWith(
        "user-a",
        "jantou_fu",
        "default",
        NOW,
      );
    });

    // 一覧と自分の順位が別々の「今」を見ると、月替わりの瞬間に違う月を集計する。
    // 1 回の getQueriesForPeriod から取った両者が同じ now を使うことがその防波堤
    it("binds the same now to both queries", () => {
      const { getRanking, getUserRankedRow } = getQueriesForPeriod(
        "monthly",
        NOW,
      );

      void getRanking("jantou_fu", "default", 0, 20);
      void getUserRankedRow("user-a", "jantou_fu", "default");

      expect(mockGetMonthlyRanking.mock.calls[0][4]).toBe(
        mockGetUserMonthlyRankedRow.mock.calls[0][3],
      );
    });
  });

  // 期間名だけをキーにすると、月が替わっても revalidate までは前月の集計が返る
  describe("cacheKey", () => {
    it("全期間は境界を持たないので期間名だけ", () => {
      expect(getQueriesForPeriod("all-time", NOW).cacheKey).toBe("all-time");
    });

    it("月間は JST の年月を含む", () => {
      expect(getQueriesForPeriod("monthly", NOW).cacheKey).toBe(
        "monthly:2026-08",
      );
    });

    it("JST の月初 0 時で次の月のキーに替わる", () => {
      expect(
        getQueriesForPeriod(
          "monthly",
          new Date("2026-09-30T23:59:59.999+09:00"),
        ).cacheKey,
      ).toBe("monthly:2026-09");
      expect(
        getQueriesForPeriod("monthly", new Date("2026-10-01T00:00:00+09:00"))
          .cacheKey,
      ).toBe("monthly:2026-10");
    });
  });
});
