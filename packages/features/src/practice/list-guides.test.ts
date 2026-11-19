import { describe, expect, it } from "vitest";

import { RANK_SLUGS, rankBySlug } from "../ranks/registry";
import {
  listedPracticeMenus,
  PRACTICE_CATEGORIES,
  relatedChaptersForPractice,
  type PracticeCategory,
} from "./catalog";
import { practiceRanks } from "./rank-practices";
import {
  PRACTICE_LIST_GUIDE_LIMIT,
  practicalPracticeChapters,
  practicalPracticeRanks,
  practiceListChapters,
  practiceListRanks,
} from "./list-guides";

/** 一覧に並ぶ、その分野の練習 */
function listedMenusIn(category: PracticeCategory) {
  return listedPracticeMenus().filter((menu) => menu.category === category);
}

describe("practiceListChapters", () => {
  it("級で絞ると、その級の前提章をすべて返す", () => {
    expect(
      new Set(practiceListChapters({ kind: "rank", value: "kyu-4" })),
    ).toEqual(new Set(rankBySlug("kyu-4")?.learnChapterSlugs));
  });

  it("分野で絞ると、その分野の練習の関連章を返す", () => {
    for (const category of PRACTICE_CATEGORIES) {
      expect(
        practiceListChapters({ kind: "category", value: category }).length,
      ).toBeGreaterThan(0);
    }
    expect(
      practiceListChapters({ kind: "category", value: "fuCalculation" }),
    ).toContain("jantou-fu");
  });

  it("分野で絞ると、その分野の練習の関連章だけを過不足なく返す", () => {
    for (const category of PRACTICE_CATEGORIES) {
      const expected = new Set(
        listedMenusIn(category).flatMap((menu) =>
          relatedChaptersForPractice(menu.slug),
        ),
      );
      expect(
        new Set(practiceListChapters({ kind: "category", value: category })),
        category,
      ).toEqual(expected);
    }
  });

  it("絞り込みが無いと、先頭だけを返す", () => {
    expect(practiceListChapters(undefined)).toHaveLength(
      PRACTICE_LIST_GUIDE_LIMIT,
    );
  });
});

describe("practiceListRanks", () => {
  it("級で絞ると、その級だけを返す", () => {
    expect(practiceListRanks({ kind: "rank", value: "kyu-3" })).toEqual([
      "kyu-3",
    ]);
  });

  it("分野で絞ると、その分野の練習が属する級を返す", () => {
    expect(
      practiceListRanks({ kind: "category", value: "fuCalculation" }),
    ).toContain("kyu-4");
  });

  it("分野で絞ると、その分野の練習が属する級だけを学習順で返す", () => {
    for (const category of PRACTICE_CATEGORIES) {
      const ranks = new Set(
        listedMenusIn(category).flatMap((menu) => practiceRanks(menu.slug)),
      );
      expect(
        practiceListRanks({ kind: "category", value: category }),
        category,
      ).toEqual(RANK_SLUGS.filter((slug) => ranks.has(slug)));
    }
    // 符の練習はすべて 4級なので、ほかの級は出ない
    expect(
      practiceListRanks({ kind: "category", value: "fuCalculation" }),
    ).toEqual(["kyu-4"]);
  });

  it("絞り込みが無いと、5級から先頭だけを返す", () => {
    expect(practiceListRanks(undefined)).toEqual(["kyu-5", "kyu-4", "kyu-3"]);
  });
});

describe("practicalPracticeChapters", () => {
  it("点数の計算の章を返す", () => {
    expect(practicalPracticeChapters()).toContain("chiitoitsu-score");
  });
});

describe("practicalPracticeRanks", () => {
  it("点数の計算の章を前提に持つ最初の級から初段までを返す", () => {
    expect(practicalPracticeRanks()).toEqual([
      "kyu-3",
      "kyu-2",
      "kyu-1",
      "dan-1",
    ]);
  });
});
