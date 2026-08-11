import { describe, expect, it } from "vitest";

import {
  IGNORE_YAKU_FOR_JUDGEMENT,
  SITUATIONAL_YAKU_KEYS,
  getYakuNameJa,
} from "./yaku-names";

/**
 * IGNORE_YAKU_FOR_JUDGEMENT は SITUATIONAL_YAKU_KEYS からの導出に変えたため、
 * 導出結果がリファクタリング前の直書きと一致することを固定する。
 */
describe("IGNORE_YAKU_FOR_JUDGEMENT", () => {
  it("ドラ2種と状況役8種を従来の順序で持つ", () => {
    expect(IGNORE_YAKU_FOR_JUDGEMENT).toEqual([
      "ドラ",
      "裏ドラ",
      "一発",
      "海底摸月",
      "河底撈魚",
      "嶺上開花",
      "槍槓",
      "ダブル立直",
      "天和",
      "地和",
    ]);
  });
});

describe("SITUATIONAL_YAKU_KEYS", () => {
  it("全て日本語名に変換できる（キーの綴り間違いを検出する）", () => {
    for (const key of SITUATIONAL_YAKU_KEYS) {
      // getYakuNameJa は未知のキーを素通しするため、変換されたことを確認する
      expect(getYakuNameJa(key), `未知の役キー: ${key}`).not.toBe(key);
    }
  });

  it("状況役8種を持つ", () => {
    expect(SITUATIONAL_YAKU_KEYS).toEqual([
      "Ippatsu",
      "Haitei",
      "Houtei",
      "Rinshan",
      "Chankan",
      "DoubleRiichi",
      "Tenhou",
      "Chiihou",
    ]);
  });
});
