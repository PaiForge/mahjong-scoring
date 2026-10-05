import { describe, expect, it } from "vitest";

import { groupCreativesByTitle } from "../title-groups";

const A = "https://www.amazon.co.jp/dp/A?tag=a-22";
const B = "https://www.amazon.co.jp/dp/A?tag=b-22";

describe("groupCreativesByTitle", () => {
  it("同じタイトルの行をスロットをまたいで束ね、掲載数とリンクを数える", () => {
    const groups = groupCreativesByTitle([
      {
        id: "1",
        slot: "s1",
        href: A,
        isActive: true,
        title: "何切る本",
        asin: null,
      },
      {
        id: "2",
        slot: "s2",
        href: A,
        isActive: false,
        title: "何切る本",
        asin: null,
      },
      {
        id: "3",
        slot: "s2",
        href: B,
        isActive: true,
        title: "何切る本",
        asin: null,
      },
      {
        id: "4",
        slot: "s1",
        href: A,
        isActive: true,
        title: "牌効率本",
        asin: null,
      },
    ]);
    expect(groups).toEqual([
      {
        title: "何切る本",
        creativeIds: ["1", "2", "3"],
        slots: ["s1", "s2"],
        activeCount: 2,
        hrefs: [A, B],
        hrefCount: 3,
        asins: [],
      },
      {
        title: "牌効率本",
        creativeIds: ["4"],
        slots: ["s1"],
        activeCount: 1,
        hrefs: [A],
        hrefCount: 1,
        asins: [],
      },
    ]);
  });

  it("ASIN の行はリンクに数えず、ASIN を集める", () => {
    const [group] = groupCreativesByTitle([
      {
        id: "1",
        slot: "s1",
        href: null,
        asin: "B08721VWS5",
        isActive: true,
        title: "本",
      },
      {
        id: "2",
        slot: "s2",
        href: null,
        asin: "B08721VWS5",
        isActive: true,
        title: "本",
      },
    ]);
    expect(group).toMatchObject({
      hrefs: [],
      hrefCount: 0,
      asins: ["B08721VWS5"],
    });
  });

  it("タイトルの無い行は束ねない", () => {
    expect(
      groupCreativesByTitle([
        { id: "1", slot: "s1", href: A, isActive: true, title: "", asin: null },
      ]),
    ).toEqual([]);
  });
});
