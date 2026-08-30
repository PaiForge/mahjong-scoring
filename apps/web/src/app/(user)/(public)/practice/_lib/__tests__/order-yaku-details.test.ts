import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { orderYakuDetails } from "../order-yaku-details";

/** 役名だけを並べた配列にする（翻数は並び替えに関与しない） */
function namesOf(details: readonly YakuDetail[]): readonly string[] {
  return details.map((detail) => detail.name);
}

/** 役名の配列から内訳を組み立てる（翻数は一律1翻） */
function detailsOf(names: readonly string[]): readonly YakuDetail[] {
  return names.map((name) => ({ name, han: 1 }));
}

describe("orderYakuDetails", () => {
  it("既定順では立直・門前清自摸和が先頭に来る", () => {
    const details = detailsOf(["断么九", "門前清自摸和", "立直"]);
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "立直",
      "門前清自摸和",
      "断么九",
    ]);
  });

  it("ユーザーが並び替えた順に従う", () => {
    const order = ["断么九", "立直", "平和"];
    const details = detailsOf(["立直", "断么九"]);
    expect(namesOf(orderYakuDetails(details, order))).toEqual([
      "断么九",
      "立直",
    ]);
  });

  it("ドラ・裏ドラは役の後ろに置く", () => {
    const details = detailsOf(["ドラ", "裏ドラ", "平和", "立直"]);
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "立直",
      "平和",
      "ドラ",
      "裏ドラ",
    ]);
  });

  it("裏ドラはドラの後ろに置く", () => {
    const details = detailsOf(["裏ドラ", "ドラ"]);
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "ドラ",
      "裏ドラ",
    ]);
  });

  it("ダブル立直は立直の位置に置く", () => {
    const details = detailsOf(["断么九", "ダブル立直"]);
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "ダブル立直",
      "断么九",
    ]);
  });

  it("風牌の役牌は役牌のかたまりの位置に置く", () => {
    const details = detailsOf(["混一色", "自風牌", "門前清自摸和"]);
    // 既定順は 門前清自摸和 → 役牌 → 混一色 の並び
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "門前清自摸和",
      "自風牌",
      "混一色",
    ]);
  });

  it("役牌が並びに無ければ風牌の役牌は役の最後に置く", () => {
    const order = ["立直", "断么九"];
    const details = detailsOf(["自風牌", "断么九"]);
    expect(namesOf(orderYakuDetails(details, order))).toEqual([
      "断么九",
      "自風牌",
    ]);
  });

  it("並びに無い役はドラの手前に元の順のまま置く", () => {
    const order = ["立直"];
    const details = detailsOf(["ドラ", "未知の役A", "未知の役B", "立直"]);
    expect(namesOf(orderYakuDetails(details, order))).toEqual([
      "立直",
      "未知の役A",
      "未知の役B",
      "ドラ",
    ]);
  });

  it("同じ位置に来る役牌は元の順を保つ", () => {
    const details = detailsOf(["自風牌", "場風牌"]);
    expect(namesOf(orderYakuDetails(details, YAKU_DEFAULT_ORDER))).toEqual([
      "自風牌",
      "場風牌",
    ]);
  });

  it("元の配列を書き換えない", () => {
    const details = detailsOf(["ドラ", "立直"]);
    orderYakuDetails(details, YAKU_DEFAULT_ORDER);
    expect(namesOf(details)).toEqual(["ドラ", "立直"]);
  });

  it("空の内訳は空のまま返す", () => {
    expect(orderYakuDetails([], YAKU_DEFAULT_ORDER)).toEqual([]);
  });
});
