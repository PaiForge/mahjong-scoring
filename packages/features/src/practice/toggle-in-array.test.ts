import { describe, expect, it } from "vitest";

import { toggleInArray } from "./toggle-in-array";

describe("toggleInArray", () => {
  it("含まれていなければ末尾に足す", () => {
    expect(toggleInArray(["nonMangan"], "manganPlus")).toEqual([
      "nonMangan",
      "manganPlus",
    ]);
  });

  it("含まれていれば除く", () => {
    expect(toggleInArray(["nonMangan", "manganPlus"], "nonMangan")).toEqual([
      "manganPlus",
    ]);
  });

  it("最後の 1 つを除くと空配列になる", () => {
    expect(toggleInArray(["nonMangan"], "nonMangan")).toEqual([]);
  });

  it("空配列にも足せる", () => {
    expect(toggleInArray([], "nonMangan")).toEqual(["nonMangan"]);
  });

  it("入力の配列を書き換えず、新しい配列を返す", () => {
    const values = Object.freeze(["nonMangan", "manganPlus"]);
    const removed = toggleInArray(values, "nonMangan");
    const added = toggleInArray(values, "other");

    expect(values).toEqual(["nonMangan", "manganPlus"]);
    expect(removed).not.toBe(values);
    expect(added).not.toBe(values);
  });
});
