import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";
import { CURRICULUM } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceMenuByType } from "@/lib/db/practice-menu-types";
import { RANK_REGISTRY, RANK_SLUGS, isRankSlug, nextRank } from "../registry";

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

  // 「1ミスでアウト」は要件側でなく練習レジストリの mistakeLimit が強制する
  // 分業になっている。試験の mistakeLimit を緩めると、要件の minScore 比較の
  // 意味（ノーミス相当で N 問正解）が変わってしまうため、ここで突き合わせる。
  it.each([
    { slug: "kyu-5", menuType: "mangan_exam", minScore: 10 },
    { slug: "kyu-4", menuType: "fu_exam", minScore: 6 },
    { slug: "kyu-3", menuType: "chiitoitsu_exam", minScore: 8 },
  ])(
    "$slug の合格条件: $menuType でミス1回・$minScore 問正解（プロダクト仕様の固定）",
    ({ slug, menuType, minScore }) => {
      const rank = RANK_REGISTRY.find((entry) => entry.slug === slug);
      expect(rank).toBeDefined();
      const requirement = rank!.requirements[0]!;
      expect(requirement.menuType).toBe(menuType);
      expect(requirement.minScore).toBe(minScore);
      expect(practiceMenuByType(requirement.menuType).mistakeLimit).toBe(1);
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

/**
 * 段級位名は `ranks.names.<slug>` / 合格基準は `ranks.criteria.<slug>` を引く。
 * レジストリに1件足しても JSON の追記漏れは実行時まで検出されないため、
 * ここで突き合わせる（practice-menu-i18n-integrity.test.ts と同じパターン）。
 */
describe("i18n integrity: ranks", () => {
  const messages = messagesJson as unknown as {
    readonly ranks: {
      readonly names: Record<string, unknown>;
      readonly criteria: Record<string, unknown>;
    };
  };

  it.each(["names", "criteria"] as const)(
    "ranks.%s が全スラッグを持ち、余分を持たない",
    (section) => {
      const keys = Object.keys(messages.ranks[section]).sort();
      expect(keys).toEqual([...RANK_SLUGS].sort());
    },
  );
});

describe("isRankSlug", () => {
  it("登録済みスラッグに true を返す", () => {
    expect(isRankSlug("kyu-5")).toBe(true);
  });

  it("未知の値に false を返す", () => {
    expect(isRankSlug("kyu-99")).toBe(false);
  });
});
