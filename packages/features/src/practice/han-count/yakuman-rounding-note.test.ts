import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildYakumanRoundingNote } from "./yakuman-rounding-note";

/** 名前空間とキーが見える翻訳関数（取り違えを検出するため素通しにしない） */
const t = {
  hanCount: (key: string) => `<hanCount.${key}>`,
  yakuBreakdown: (key: string, values?: Record<string, number>) =>
    key === "han" ? `${values?.count}翻` : `<yakuBreakdown.${key}>`,
};

/** 各役の翻数を並べた内訳（役名は位置で振る） */
function detailsOf(...hans: readonly number[]) {
  return hans.map((han, index) => ({ name: `役${index}`, han }));
}

describe("buildYakumanRoundingNote", () => {
  it("正解が役満で内訳の合計が 13 翻を超えるときだけ、丸めの補足を出す", () => {
    expect(buildYakumanRoundingNote(detailsOf(13, 2, 1), YAKUMAN_HAN, t)).toBe(
      "16翻 → <hanCount.yakuman>（<hanCount.yakumanNote>）",
    );
  });

  it("14 翻（超過の最小）でも出す", () => {
    expect(buildYakumanRoundingNote(detailsOf(13, 1), YAKUMAN_HAN, t)).toBe(
      "14翻 → <hanCount.yakuman>（<hanCount.yakumanNote>）",
    );
  });

  it("内訳の合計がちょうど 13 翻なら丸めていないので出さない", () => {
    expect(
      buildYakumanRoundingNote(detailsOf(6, 4, 3), YAKUMAN_HAN, t),
    ).toBeUndefined();
  });

  it("正解が役満でなければ、合計が正解を超えても出さない（丸め以外の食い違い）", () => {
    expect(buildYakumanRoundingNote(detailsOf(8, 6), 12, t)).toBeUndefined();
    expect(buildYakumanRoundingNote(detailsOf(3, 2), 4, t)).toBeUndefined();
  });

  it("非役満で合計と正解が一致すれば出さない", () => {
    expect(buildYakumanRoundingNote(detailsOf(2, 1), 3, t)).toBeUndefined();
  });
});
