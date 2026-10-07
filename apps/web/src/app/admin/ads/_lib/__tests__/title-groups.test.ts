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
        platform: "web",
        href: A,
        isActive: true,
        title: "何切る本",
        asin: null,
      },
      {
        id: "2",
        slot: "s2",
        platform: "web",
        href: A,
        isActive: false,
        title: "何切る本",
        asin: null,
      },
      {
        id: "3",
        slot: "s2",
        platform: "web",
        href: B,
        isActive: true,
        title: "何切る本",
        asin: null,
      },
      {
        id: "4",
        slot: "s1",
        platform: "web",
        href: A,
        isActive: true,
        title: "牌効率本",
        asin: null,
      },
    ]);
    expect(groups).toEqual([
      {
        title: "何切る本",
        total: 3,
        activeCount: 2,
        sides: [
          {
            platform: "web",
            total: 3,
            slots: ["s1", "s2"],
            activeCount: 2,
            hrefs: [A, B],
            hrefCount: 3,
            asins: [],
          },
        ],
      },
      {
        title: "牌効率本",
        total: 1,
        activeCount: 1,
        sides: [
          {
            platform: "web",
            total: 1,
            slots: ["s1"],
            activeCount: 1,
            hrefs: [A],
            hrefCount: 1,
            asins: [],
          },
        ],
      },
    ]);
  });

  it("web とアプリの行を分けて数え、web → アプリの順に並べる", () => {
    const [group] = groupCreativesByTitle([
      {
        id: "1",
        slot: "m1",
        platform: "mobile",
        href: B,
        isActive: false,
        title: "本",
        asin: null,
      },
      {
        id: "2",
        slot: "w1",
        platform: "web",
        href: A,
        isActive: true,
        title: "本",
        asin: null,
      },
    ]);
    expect(group).toEqual({
      title: "本",
      total: 2,
      activeCount: 1,
      sides: [
        {
          platform: "web",
          total: 1,
          slots: ["w1"],
          activeCount: 1,
          hrefs: [A],
          hrefCount: 1,
          asins: [],
        },
        {
          platform: "mobile",
          total: 1,
          slots: ["m1"],
          activeCount: 0,
          hrefs: [B],
          hrefCount: 1,
          asins: [],
        },
      ],
    });
  });

  it("ASIN の行はリンクに数えず、ASIN を集める", () => {
    const [group] = groupCreativesByTitle([
      {
        id: "1",
        slot: "s1",
        platform: "web",
        href: null,
        asin: "B08721VWS5",
        isActive: true,
        title: "本",
      },
      {
        id: "2",
        slot: "s2",
        platform: "web",
        href: null,
        asin: "B08721VWS5",
        isActive: true,
        title: "本",
      },
    ]);
    expect(group?.sides[0]).toMatchObject({
      hrefs: [],
      hrefCount: 0,
      asins: ["B08721VWS5"],
    });
  });

  it("タイトルの無い行は束ねない", () => {
    expect(
      groupCreativesByTitle([
        {
          id: "1",
          slot: "s1",
          platform: "web",
          href: A,
          isActive: true,
          title: "",
          asin: null,
        },
      ]),
    ).toEqual([]);
  });
});
