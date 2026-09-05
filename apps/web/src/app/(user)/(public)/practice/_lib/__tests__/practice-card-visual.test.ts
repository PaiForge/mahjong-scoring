import { describe, expect, it } from "vitest";

import { listedPracticeMenus } from "../practice-catalog";
import { hasPracticeCardVisual } from "../practice-card-visual";

describe("練習カードの例示", () => {
  it("一覧に並ぶ練習はすべて例示を持つ", () => {
    const missing = listedPracticeMenus()
      .map((menu) => menu.slug)
      .filter((slug) => !hasPracticeCardVisual(slug));

    expect(missing).toEqual([]);
  });
});
