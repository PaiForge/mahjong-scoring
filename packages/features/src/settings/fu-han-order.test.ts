import { describe, expect, it } from "vitest";

import { DEFAULT_FU_HAN_ORDER, orderFuHan } from "./fu-han-order";

describe("orderFuHan", () => {
  it("既定は翻→符（一般的な言い方の順）", () => {
    expect(DEFAULT_FU_HAN_ORDER).toBe("han-first");
    expect(
      orderFuHan(DEFAULT_FU_HAN_ORDER, { fu: "30符", han: "4翻" }),
    ).toEqual(["4翻", "30符"]);
  });

  it("符→翻にすると入れ替わる", () => {
    expect(orderFuHan("fu-first", { fu: "30符", han: "4翻" })).toEqual([
      "30符",
      "4翻",
    ]);
  });

  it("符が無い（満貫以上）ときはどちらの順でも翻だけになる", () => {
    expect(orderFuHan("fu-first", { han: "5翻" })).toEqual(["5翻"]);
    expect(orderFuHan("han-first", { han: "5翻" })).toEqual(["5翻"]);
  });
});
