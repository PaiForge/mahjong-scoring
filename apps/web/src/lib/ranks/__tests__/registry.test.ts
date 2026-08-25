import { describe, expect, it } from "vitest";

import { practiceMenuByType } from "@/lib/db/practice-menu-types";
import { RANK_REGISTRY, RANK_SLUGS, isRankSlug } from "../registry";

describe("RANK_REGISTRY", () => {
  it("slug が一意である", () => {
    expect(new Set(RANK_SLUGS).size).toBe(RANK_SLUGS.length);
  });

  it("level が昇順かつ一意である", () => {
    const levels = RANK_REGISTRY.map((rank) => rank.level);
    expect(levels).toEqual([...new Set(levels)].sort((a, b) => a - b));
  });

  it("全ランクが最低1つの要件を持つ（要件なしの昇級素通りを防ぐ）", () => {
    for (const rank of RANK_REGISTRY) {
      expect(
        rank.requirements.length,
        `${rank.slug} に要件がない`,
      ).toBeGreaterThan(0);
    }
  });

  it("5級の合格条件: 昇級試験でミス1回・10問正解（プロダクト仕様の固定）", () => {
    // 「1ミスでアウト」は要件側でなく練習レジストリの mistakeLimit が強制する
    // 分業になっている。試験の mistakeLimit を緩めると、要件の minScore 比較の
    // 意味（ノーミス相当で10問正解）が変わってしまうため、ここで突き合わせる。
    const kyu5 = RANK_REGISTRY.find((rank) => rank.slug === "kyu-5");
    expect(kyu5).toBeDefined();
    const requirement = kyu5!.requirements[0]!;
    expect(requirement.menuType).toBe("mangan_exam");
    expect(requirement.minScore).toBe(10);
    expect(practiceMenuByType(requirement.menuType).mistakeLimit).toBe(1);
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
