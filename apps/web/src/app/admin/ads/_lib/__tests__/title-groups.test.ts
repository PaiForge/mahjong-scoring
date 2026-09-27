import { describe, expect, it } from "vitest";

import { groupCreativesByTitle } from "../title-groups";

const A = "https://www.amazon.co.jp/dp/A?tag=a-22";
const B = "https://www.amazon.co.jp/dp/A?tag=b-22";

describe("groupCreativesByTitle", () => {
  it("同じタイトルの行をスロットをまたいで束ね、掲載数とリンクを数える", () => {
    const groups = groupCreativesByTitle([
      { id: "1", slot: "s1", href: A, isActive: true, title: "何切る本" },
      { id: "2", slot: "s2", href: A, isActive: false, title: "何切る本" },
      { id: "3", slot: "s2", href: B, isActive: true, title: "何切る本" },
      { id: "4", slot: "s1", href: A, isActive: true, title: "牌効率本" },
    ]);
    expect(groups).toEqual([
      {
        title: "何切る本",
        creativeIds: ["1", "2", "3"],
        slots: ["s1", "s2"],
        activeCount: 2,
        hrefs: [A, B],
      },
      {
        title: "牌効率本",
        creativeIds: ["4"],
        slots: ["s1"],
        activeCount: 1,
        hrefs: [A],
      },
    ]);
  });

  it("タイトルの無い行は束ねない", () => {
    expect(
      groupCreativesByTitle([
        { id: "1", slot: "s1", href: A, isActive: true, title: "" },
      ]),
    ).toEqual([]);
  });
});
