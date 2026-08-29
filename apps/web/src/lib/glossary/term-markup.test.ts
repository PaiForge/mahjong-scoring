import { describe, expect, it } from "vitest";

import { collectTermSlugs, parseTermMarkup } from "./term-markup";

describe("parseTermMarkup", () => {
  it("マークアップの無い文字列はテキスト1個になる", () => {
    expect(parseTermMarkup("順子は0符です")).toEqual([
      { type: "text", value: "順子は0符です" },
    ]);
  });

  it("空文字列は空配列になる", () => {
    expect(parseTermMarkup("")).toEqual([]);
  });

  it("表示語を省いた [[slug]] は slug をそのまま表示語にする", () => {
    expect(parseTermMarkup("[[fu]]の話")).toEqual([
      { type: "term", slug: "fu", label: "fu" },
      { type: "text", value: "の話" },
    ]);
  });

  it("[[slug|表示語]] は表示語を分けて取り出す", () => {
    expect(parseTermMarkup("[[shuntsu|順子]]は0符")).toEqual([
      { type: "term", slug: "shuntsu", label: "順子" },
      { type: "text", value: "は0符" },
    ]);
  });

  it("前後のテキストと複数の用語を順に並べる", () => {
    expect(
      parseTermMarkup("[[koutsu|刻子]]と[[kantsu|槓子]]は符が付く"),
    ).toEqual([
      { type: "term", slug: "koutsu", label: "刻子" },
      { type: "text", value: "と" },
      { type: "term", slug: "kantsu", label: "槓子" },
      { type: "text", value: "は符が付く" },
    ]);
  });

  it("slug と表示語の前後の空白は落とす", () => {
    expect(parseTermMarkup("[[ fu | 符 ]]")).toEqual([
      { type: "term", slug: "fu", label: "符" },
    ]);
  });

  it("閉じていないマークアップは文字のまま残す", () => {
    expect(parseTermMarkup("[[fu の話")).toEqual([
      { type: "text", value: "[[fu の話" },
    ]);
  });

  it("空白だけの slug はマークアップとして扱わない", () => {
    expect(parseTermMarkup("[[   ]]")).toEqual([
      { type: "text", value: "[[   ]]" },
    ]);
  });

  it("呼び出しをまたいで正規表現の状態が残らない", () => {
    const input = "[[fu|符]]と[[han|翻]]";
    expect(parseTermMarkup(input)).toEqual(parseTermMarkup(input));
  });
});

describe("collectTermSlugs", () => {
  it("初出順で重複なく集める", () => {
    expect(
      collectTermSlugs("[[fu|符]]と[[han|翻]]、そしてもう一度[[fu|符]]"),
    ).toEqual(["fu", "han"]);
  });

  it("マークアップが無ければ空配列", () => {
    expect(collectTermSlugs("符と翻")).toEqual([]);
  });
});
