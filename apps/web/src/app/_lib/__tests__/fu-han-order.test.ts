import { describe, expect, it } from "vitest";

import { DEFAULT_FU_HAN_ORDER, orderFuHan } from "../fu-han-order";

describe("orderFuHan", () => {
  it("既定は符→翻（点数表を引く目線と同じ順）", () => {
    expect(DEFAULT_FU_HAN_ORDER).toBe("fu-first");
    expect(
      orderFuHan(DEFAULT_FU_HAN_ORDER, { fu: "30符", han: "4翻" }),
    ).toEqual(["30符", "4翻"]);
  });

  it("翻→符にすると入れ替わる", () => {
    expect(orderFuHan("han-first", { fu: "30符", han: "4翻" })).toEqual([
      "4翻",
      "30符",
    ]);
  });

  it("符が無い（満貫以上）ときはどちらの順でも翻だけになる", () => {
    expect(orderFuHan("fu-first", { han: "5翻" })).toEqual(["5翻"]);
    expect(orderFuHan("han-first", { han: "5翻" })).toEqual(["5翻"]);
  });
});
