import { describe, expect, it } from "vitest";

import { lessonHref, practiceHref, rankHref } from "./routes";

describe("practiceHref", () => {
  it("slug から練習ページのパスを作る", () => {
    expect(practiceHref("jantou-fu")).toBe("/practice/jantou-fu");
  });

  it("バリアントを渡すとクエリに載せる", () => {
    expect(practiceHref("score-table", "all")).toBe(
      "/practice/score-table?variant=all",
    );
  });

  it("バリアントを持たない練習にはクエリを付けない", () => {
    expect(practiceHref("jantou-fu", "default")).toBe("/practice/jantou-fu");
  });
});

describe("rankHref", () => {
  it("段級位の詳細の親パスの下に slug を置く", () => {
    expect(rankHref("kyu-5")).toBe("/dojo/ranks/kyu-5");
  });
});

describe("lessonHref", () => {
  it("slug からレッスンページのパスを作る", () => {
    expect(lessonHref("mangan-ko-ron")).toBe("/lessons/mangan-ko-ron");
  });
});
