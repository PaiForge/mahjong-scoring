import { describe, expect, it } from "vitest";

import {
  listedPracticeMenus,
  listedPracticeRanks,
  PRACTICE_CATEGORIES,
} from "@mahjong-scoring/features/practice/catalog";
import {
  matchesPracticeFilter,
  practiceListHref,
  type PracticeListFilter,
} from "../practice-web-routes";

describe("practiceListHref", () => {
  it("絞り込みを渡すとその条件で絞った練習一覧のパスになる", () => {
    // 昇級試験のページが「その級の練習」として開くリンク。クエリ名は
    // 一覧のフィルタと同じ定数から組み立てる
    expect(practiceListHref()).toBe("/practice");
    expect(practiceListHref({ kind: "rank", value: "kyu-4" })).toBe(
      "/practice?rank=kyu-4",
    );
    expect(practiceListHref({ kind: "category", value: "han" })).toBe(
      "/practice?category=han",
    );
  });

  it("どの選択肢を選んでも 1 件以上残る", () => {
    // 級と分野は直交していないため 2 軸の AND にはしていない（4級 × 翻数 が
    // 0 件になる）。1 本の排他選択である限り空振りは起きないことを固定する。
    // 級の選択肢は全段級位ではなく一覧の中身から導く（`listedPracticeRanks`）
    const menus = listedPracticeMenus();
    const filters: PracticeListFilter[] = [
      ...listedPracticeRanks().map((value) => ({
        kind: "rank" as const,
        value,
      })),
      ...PRACTICE_CATEGORIES.map((value) => ({
        kind: "category" as const,
        value,
      })),
    ];
    for (const filter of filters) {
      const listed = menus.filter((menu) =>
        matchesPracticeFilter(filter, menu),
      );
      expect(listed.length, `${filter.kind}=${filter.value}`).toBeGreaterThan(
        0,
      );
    }
  });
});
