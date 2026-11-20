import { describe, expect, it } from "vitest";
import { setsEqual } from "./set-equal";

describe("setsEqual", () => {
  it("並びと重複を無視して同じ要素の集合なら等しい", () => {
    expect(setsEqual(["a", "b", "b"], ["b", "a"])).toBe(true);
  });

  it("片方にだけ余分な要素があれば等しくない", () => {
    expect(setsEqual(["a"], ["a", "b"])).toBe(false);
    expect(setsEqual(["a", "b"], ["a"])).toBe(false);
  });

  it("要素の数が同じでも中身が違えば等しくない", () => {
    expect(setsEqual(["a", "b"], ["a", "c"])).toBe(false);
  });
});
