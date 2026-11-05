import { describe, expect, it } from "vitest";

import {
  lessonsListHref,
  myRecordHref,
  practiceHref,
  practiceListHrefForRank,
  rankHref,
} from "./routes";

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

describe("practiceListHrefForRank", () => {
  it("級の slug を rank のクエリに載せる", () => {
    expect(practiceListHrefForRank("kyu-4")).toBe("/practice?rank=kyu-4");
  });
});

describe("lessonsListHref", () => {
  it("級を渡さなければ全レッスンの目次", () => {
    expect(lessonsListHref()).toBe("/lessons");
  });

  it("級を渡すとその級で絞った目次", () => {
    expect(lessonsListHref("kyu-5")).toBe("/lessons?rank=kyu-5");
  });
});

describe("rankHref", () => {
  it("段級位の詳細の親パスの下に slug を置く", () => {
    expect(rankHref("kyu-5")).toBe("/dojo/ranks/kyu-5");
  });
});

describe("myRecordHref", () => {
  it("土俵を menu と variant のクエリで運ぶ", () => {
    expect(myRecordHref({ menuType: "yaku_han", variant: "kuisagari" })).toBe(
      "/mypage/challenges?menu=yaku_han&variant=kuisagari",
    );
  });
});
