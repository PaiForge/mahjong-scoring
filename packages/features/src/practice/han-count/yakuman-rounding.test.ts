import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildYakumanRounding } from "./yakuman-rounding";

/** キーが見える翻訳関数（取り違えを検出するため素通しにしない） */
const t = (key: string) => `<hanCount.${key}>`;

/** 各役の翻数を並べた内訳（役名は位置で振る） */
function detailsOf(...hans: readonly number[]) {
  return hans.map((han, index) => ({ name: `役${index}`, han }));
}

const ROUNDED = {
  label: "<hanCount.yakumanRoundedLabel>",
  value: "<hanCount.yakuman>",
};

describe("buildYakumanRounding", () => {
  it("正解が役満で内訳の合計が 13 翻を超えるときだけ、丸めた結論の行を出す", () => {
    expect(buildYakumanRounding(detailsOf(13, 2, 1), YAKUMAN_HAN, t)).toEqual(
      ROUNDED,
    );
  });

  it("14 翻（超過の最小）でも出す", () => {
    expect(buildYakumanRounding(detailsOf(13, 1), YAKUMAN_HAN, t)).toEqual(
      ROUNDED,
    );
  });

  it("内訳の合計がちょうど 13 翻なら丸めていないので出さない", () => {
    expect(
      buildYakumanRounding(detailsOf(6, 4, 3), YAKUMAN_HAN, t),
    ).toBeUndefined();
  });

  it("正解が役満でなければ、合計が正解を超えても出さない（丸め以外の食い違い）", () => {
    expect(buildYakumanRounding(detailsOf(8, 6), 12, t)).toBeUndefined();
    expect(buildYakumanRounding(detailsOf(3, 2), 4, t)).toBeUndefined();
  });

  it("非役満で合計と正解が一致すれば出さない", () => {
    expect(buildYakumanRounding(detailsOf(2, 1), 3, t)).toBeUndefined();
  });
});
