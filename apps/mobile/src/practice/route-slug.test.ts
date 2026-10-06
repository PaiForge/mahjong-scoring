import { describe, expect, it } from "vitest";
import {
  PRACTICE_MENU_SLUGS,
  practiceMenuBySlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { practiceSlugFromBasePath } from "./route-slug";

describe("practiceSlugFromBasePath", () => {
  it("練習のパスから slug を引く", () => {
    expect(practiceSlugFromBasePath("/practice/jantou-fu")).toBe("jantou-fu");
  });

  it("昇級試験は basePath（/exam/<級>）から引く", () => {
    expect(practiceSlugFromBasePath("/exam/mangan")).toBe("mangan-exam");
  });

  it("すべての練習が自分の basePath から引ける（パスの組み立てと逆引きが食い違わない）", () => {
    for (const slug of PRACTICE_MENU_SLUGS) {
      expect(practiceSlugFromBasePath(practiceMenuBySlug(slug).basePath)).toBe(
        slug,
      );
    }
  });

  it("未知のパスは undefined", () => {
    expect(practiceSlugFromBasePath("/practice/unknown")).toBeUndefined();
  });
});
