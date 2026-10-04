import { describe, expect, it } from "vitest";

import { listedPracticeMenus } from "./catalog";
import { listedPracticeRanks, practiceRanks } from "./rank-practices";

describe("practiceRanks", () => {
  it("カタログの級に加えて、その練習を行程に並べている級にも属する", () => {
    // 点数表早引きはカタログでは 3級だが、5級の章が満貫以上の範囲で送っている
    expect(practiceRanks("score-table")).toEqual(["kyu-5", "kyu-3"]);
  });

  it("行程に並ばない練習はカタログの級だけに属する", () => {
    // 2級の章は練習へ送っていない
    expect(practiceRanks("score-calculation")).toEqual(["kyu-2"]);
  });

  it("一覧に並ぶ練習はどれもいずれかの級に属する", () => {
    for (const menu of listedPracticeMenus()) {
      expect(practiceRanks(menu.slug).length, menu.slug).toBeGreaterThan(0);
    }
  });
});

describe("listedPracticeRanks", () => {
  it("一覧に並ぶ練習を持つ級だけを学習順で返す", () => {
    // 1級・初段は昇級試験だけで完結し、一覧に並ぶ練習を持たない
    expect(listedPracticeRanks()).toEqual(["kyu-5", "kyu-4", "kyu-3", "kyu-2"]);
  });
});
