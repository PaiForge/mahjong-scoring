import { describe, expect, it } from "vitest";

import { generateScoreQuestion } from "../problem/score/generator";
import { menzenFu } from "./menzen-fu";

/** 副底・和了の符（= 積み上げた符ではないもの）の理由 */
const NON_EXTRA_REASONS = new Set(["副底", "ツモ", "門前加符"]);

describe("menzenFu", () => {
  it("ツモは30符から、積み上げた符を10で切り捨てた分だけ上がる", () => {
    expect(menzenFu(2, "tsumo")).toBe(30);
    expect(menzenFu(8, "tsumo")).toBe(30);
    expect(menzenFu(10, "tsumo")).toBe(40);
    expect(menzenFu(18, "tsumo")).toBe(40);
    expect(menzenFu(20, "tsumo")).toBe(50);
  });

  it("ロンは30符から、積み上げた符を10で切り上げた分だけ上がる", () => {
    expect(menzenFu(2, "ron")).toBe(40);
    expect(menzenFu(10, "ron")).toBe(40);
    expect(menzenFu(12, "ron")).toBe(50);
    expect(menzenFu(20, "ron")).toBe(50);
    expect(menzenFu(22, "ron")).toBe(60);
  });

  it("ロンが30符に留まるのは積み上げた符が0のとき（= 平和）だけ", () => {
    expect(menzenFu(0, "ron")).toBe(30);
    // 積み上げた符が0のツモは平和ツモの20符特例に当たるため menzenFu の対象外
  });

  /**
   * 教本の表がライブラリの符計算とずれていないことを、実際に生成した
   * 門前手で突き合わせる。menzenFu は副底・和了の符・切り上げを
   * 教本の向き（積み上げた符 → 符）に組み直したものなので、
   * 手を作って符を出した結果と一致していなければならない。
   */
  it("生成した門前手（平和・七対子以外）の符と一致する", () => {
    let checked = 0;
    for (let i = 0; i < 5000; i++) {
      const question = generateScoreQuestion({
        includeFuro: false,
        includeChiitoi: false,
      });
      if (!question) continue;
      const yakuNames = (question.yakuDetails ?? []).map((yaku) => yaku.name);
      if (yakuNames.includes("平和")) continue;
      const details = question.fuDetails ?? [];
      if (details.length === 0) continue;

      const extraFu = details
        .filter((detail) => !NON_EXTRA_REASONS.has(detail.reason))
        .reduce((sum, detail) => sum + detail.fu, 0);
      expect(
        menzenFu(extraFu, question.isTsumo ? "tsumo" : "ron"),
        `積み上げ${extraFu}符 / ${JSON.stringify(details)}`,
      ).toBe(question.answer.fu);
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it("門前ロンの符は必ず40符以上になる（30符は平和だけ）", () => {
    for (let i = 0; i < 5000; i++) {
      const question = generateScoreQuestion({
        includeFuro: false,
        includeChiitoi: false,
      });
      if (!question || question.isTsumo) continue;
      const yakuNames = (question.yakuDetails ?? []).map((yaku) => yaku.name);
      if (yakuNames.includes("平和")) continue;
      expect(question.answer.fu).toBeGreaterThanOrEqual(40);
    }
  });
});
