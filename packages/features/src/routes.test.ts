import { describe, expect, it } from "vitest";

import { practiceHref } from "./routes";

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
