import { describe, expect, it } from "vitest";

import { buildExpBreakdown } from "./exp-breakdown";

describe("buildExpBreakdown", () => {
  it("練習種別を経験値の多い順に並べる", () => {
    expect(
      buildExpBreakdown({ jantou_fu: 10, machi_fu: 30, yaku: 20 }),
    ).toEqual({
      rows: [
        { menuType: "machi_fu", exp: 30 },
        { menuType: "yaku", exp: 20 },
        { menuType: "jantou_fu", exp: 10 },
      ],
      otherExp: 0,
    });
  });

  it("レジストリに無い種別は落とさず「その他」に合算する", () => {
    expect(
      buildExpBreakdown({ jantou_fu: 10, new_menu: 7, unknown: 3 }),
    ).toEqual({
      rows: [{ menuType: "jantou_fu", exp: 10 }],
      otherExp: 10,
    });
  });

  it("活動の無い日は行もその他も無い", () => {
    expect(buildExpBreakdown({})).toEqual({ rows: [], otherExp: 0 });
  });
});
