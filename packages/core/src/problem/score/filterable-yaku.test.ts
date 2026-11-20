import { describe, expect, it } from "vitest";

import { SCORE_FILTERABLE_YAKU } from "./filterable-yaku";

/**
 * 収録する役そのもの（出現率の実測で決めた一覧）は値で写さず、絞り込みの
 * 選択肢として成り立つための不変条件だけを確かめる。各役が実際に生成できる
 * ことは generator.test.ts が確かめる。
 */
describe("SCORE_FILTERABLE_YAKU", () => {
  it("絞り込みに選べる役が少なくとも 1 つある", () => {
    expect(SCORE_FILTERABLE_YAKU.length).toBeGreaterThan(0);
  });

  it("同じ役を重複して載せない", () => {
    expect(new Set(SCORE_FILTERABLE_YAKU).size).toBe(
      SCORE_FILTERABLE_YAKU.length,
    );
  });
});
