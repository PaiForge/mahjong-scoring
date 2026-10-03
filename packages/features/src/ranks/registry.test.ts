import { describe, expect, it } from "vitest";

import { CURRICULUM } from "../curriculum/registry";
import { practiceMenuByType } from "../practice-menu-types";
import {
  RANK_REGISTRY,
  RANK_SLUGS,
  isRankSlug,
  nextRank,
  rankTier,
} from "./registry";

describe("RANK_REGISTRY", () => {
  it("slug が一意である", () => {
    expect(new Set(RANK_SLUGS).size).toBe(RANK_SLUGS.length);
  });

  it("level が昇順かつ一意である", () => {
    const levels = RANK_REGISTRY.map((rank) => rank.level);
    expect(levels).toEqual([...new Set(levels)].sort((a, b) => a - b));
  });

  it("試験が級ごとに一意である（1 つの試験が 2 つの級を決めない）", () => {
    const menuTypes = RANK_REGISTRY.map((rank) => rank.exam.menuType);
    expect(new Set(menuTypes).size).toBe(menuTypes.length);
  });

  // 「1ミスでアウト」は要件側でなく練習レジストリの mistakeLimit が強制する
  // 分業になっている。試験の mistakeLimit を緩めると、要件の minScore 比較の
  // 意味（ノーミス相当で N 問正解）が変わってしまうため、ここで突き合わせる。
  it.each([
    { slug: "kyu-5", menuType: "mangan_exam", minScore: 10 },
    { slug: "kyu-4", menuType: "fu_exam", minScore: 6 },
    { slug: "kyu-3", menuType: "chiitoitsu_exam", minScore: 8 },
    { slug: "kyu-2", menuType: "pinfu_exam", minScore: 8 },
    { slug: "kyu-1", menuType: "fu_score_exam", minScore: 4 },
    { slug: "dan-1", menuType: "score_exam", minScore: 4 },
  ])(
    "$slug の合格条件: $menuType でミス1回・$minScore 問正解（プロダクト仕様の固定）",
    ({ slug, menuType, minScore }) => {
      const rank = RANK_REGISTRY.find((entry) => entry.slug === slug);
      expect(rank).toBeDefined();
      expect(rank!.exam.menuType).toBe(menuType);
      expect(rank!.exam.minScore).toBe(minScore);
      expect(practiceMenuByType(rank!.exam.menuType).mistakeLimit).toBe(1);
    },
  );

  it("前提章がカリキュラムの表示順で並んでいる（道場がそのまま描画する）", () => {
    const orderBySlug = new Map(
      CURRICULUM.map((chapter) => [chapter.slug, chapter.order]),
    );
    for (const rank of RANK_REGISTRY) {
      const orders = rank.learnChapterSlugs.map((slug) =>
        orderBySlug.get(slug)!,
      );
      expect(orders, `${rank.slug} の前提章がカリキュラム順でない`).toEqual(
        [...orders].sort((a, b) => a - b),
      );
      expect(
        new Set(rank.learnChapterSlugs).size,
        `${rank.slug} の前提章が重複している`,
      ).toBe(rank.learnChapterSlugs.length);
    }
  });
});

describe("nextRank", () => {
  it("未達成なら最下位のランクを返す", () => {
    expect(nextRank([])?.slug).toBe("kyu-5");
  });

  it("全ランク達成済みなら undefined", () => {
    expect(nextRank(RANK_SLUGS)).toBeUndefined();
  });
});

describe("rankTier", () => {
  it("級には kyu、段には dan を返す", () => {
    expect(rankTier("kyu-1")).toBe("kyu");
    expect(rankTier("dan-1")).toBe("dan");
  });
});

describe("isRankSlug", () => {
  it("登録済みスラッグに true を返す", () => {
    expect(isRankSlug("kyu-5")).toBe(true);
  });

  it("未知の値に false を返す", () => {
    expect(isRankSlug("kyu-99")).toBe(false);
  });
});
