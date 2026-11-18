import { describe, expect, it } from "vitest";

import { YAKUMAN_HAN } from "../score/tiers";
import {
  IGNORE_YAKU_FOR_JUDGEMENT,
  SCORE_YAKU_NAME_MAP,
  SITUATIONAL_YAKU_KEYS,
  YAKU_OPTIONS,
  getYakuNameJa,
  hasYakumanYaku,
} from "./yaku-names";

/**
 * 役名の対応表は値を写して検証しない（写しは実装の複製で、誤りも一緒に写る）。
 * 代わりに「表示に使える名前であること」と「他の表と食い違わないこと」を不変条件で見る。
 */
describe("SCORE_YAKU_NAME_MAP", () => {
  const names = Object.values(SCORE_YAKU_NAME_MAP);

  it("どの役にも空でない日本語名がある", () => {
    for (const [key, name] of Object.entries(SCORE_YAKU_NAME_MAP)) {
      expect(name.trim(), `役名が空: ${key}`).not.toBe("");
    }
  });

  it("別の役が同じ日本語名を持たない（内訳で役を見分けられる）", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("役の選択肢に出る名前はすべて対応表の日本語名のどれかである", () => {
    const known = new Set(names);
    const unknown = YAKU_OPTIONS.filter((option) => !known.has(option));
    expect(unknown).toEqual([]);
  });
});

describe("getYakuNameJa", () => {
  it("対応表に無いキーはそのまま返す", () => {
    expect(getYakuNameJa("NotAYaku")).toBe("NotAYaku");
  });
});

describe("hasYakumanYaku", () => {
  it("役満の翻数ちょうどの役があれば役満の手である", () => {
    expect(
      hasYakumanYaku([
        ["Kokushi", YAKUMAN_HAN],
        ["Dora", 1],
      ]),
    ).toBe(true);
  });

  it("通常役の合計が 13 翻を超えても役満役が無ければ役満の手ではない", () => {
    expect(
      hasYakumanYaku([
        ["Chinitsu", 6],
        ["Ryanpeikou", 3],
        ["Pinfu", 1],
        ["Tanyao", 1],
        ["Dora", YAKUMAN_HAN - 1],
      ]),
    ).toBe(false);
  });

  it("役が無ければ役満の手ではない", () => {
    expect(hasYakumanYaku([])).toBe(false);
  });
});

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
