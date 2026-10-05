import { describe, expect, it } from "vitest";

import { moveInOrder } from "../reorder";

describe("moveInOrder", () => {
  it("1 つ上 / 下の広告と入れ替える", () => {
    expect(moveInOrder(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveInOrder(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("端を越える移動と知らない id は何もしない", () => {
    expect(moveInOrder(["a", "b"], "a", "up")).toBeUndefined();
    expect(moveInOrder(["a", "b"], "b", "down")).toBeUndefined();
    expect(moveInOrder(["a", "b"], "z", "up")).toBeUndefined();
  });
});
