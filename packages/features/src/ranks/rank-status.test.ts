import { describe, expect, it } from "vitest";

import { evaluateExamEligibility } from "./exam-eligibility";
import { RANK_REGISTRY, type RankSlug } from "./registry";
import { resolveRankStatus } from "./rank-status";

describe("resolveRankStatus", () => {
  it("無級なら最初の級だけが次の目標で、残りは未取得", () => {
    expect(
      RANK_REGISTRY.map((rank) => resolveRankStatus(rank.slug, [])),
    ).toEqual([
      "next",
      "unachieved",
      "unachieved",
      "unachieved",
      "unachieved",
      "unachieved",
    ]);
  });

  it("取得済みの級の次が次の目標になる", () => {
    const achieved: RankSlug[] = ["kyu-5", "kyu-4"];
    expect(resolveRankStatus("kyu-5", achieved)).toBe("achieved");
    expect(resolveRankStatus("kyu-4", achieved)).toBe("achieved");
    expect(resolveRankStatus("kyu-3", achieved)).toBe("next");
    expect(resolveRankStatus("kyu-2", achieved)).toBe("unachieved");
  });

  it("飛び番の保持では最下位の未取得が次の目標になる", () => {
    const achieved: RankSlug[] = ["kyu-5", "kyu-2"];
    expect(resolveRankStatus("kyu-4", achieved)).toBe("next");
    expect(resolveRankStatus("kyu-3", achieved)).toBe("unachieved");
    expect(resolveRankStatus("kyu-2", achieved)).toBe("achieved");
  });

  it("全取得なら次の目標は無い", () => {
    const achieved = RANK_REGISTRY.map((rank) => rank.slug);
    for (const rank of RANK_REGISTRY) {
      expect(resolveRankStatus(rank.slug, achieved)).toBe("achieved");
    }
  });

  // 一覧の「次の目標」と試験ページの受験可否が食い違わないこと
  it.each<{ readonly achieved: readonly RankSlug[] }>([
    { achieved: [] },
    { achieved: ["kyu-5"] },
    { achieved: ["kyu-5", "kyu-2"] },
  ])(
    "次の目標は受験資格の eligible と一致する（保持: $achieved）",
    ({ achieved }) => {
      for (const rank of RANK_REGISTRY) {
        const eligibility = evaluateExamEligibility(
          rank.exam.menuType,
          achieved,
        );
        expect(resolveRankStatus(rank.slug, achieved) === "next").toBe(
          eligibility?.kind === "eligible",
        );
      }
    },
  );
});
