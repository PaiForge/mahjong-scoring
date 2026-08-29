import { describe, expect, it } from "vitest";
import { isMenzen } from "@pai-forge/riichi-mahjong";

import { generateScoreQuestion } from "../problem/score/generator";
import { mentsuTehaiFu } from "./mentsu-tehai-fu";

/** 副底・和了の符（= 積み上げた符ではないもの）の理由 */
const NON_EXTRA_REASONS = new Set(["副底", "ツモ", "門前加符", "特例等の加符"]);

/** 面子・雀頭・待ちで積み上げた符の合計を符内訳から取り出す */
function extraFuOf(details: readonly { reason: string; fu: number }[]): number {
  return details
    .filter((detail) => !NON_EXTRA_REASONS.has(detail.reason))
    .reduce((sum, detail) => sum + detail.fu, 0);
}

describe("mentsuTehaiFu", () => {
  it("ツモは門前でも副露でも30符から、積み上げた符を10で切り捨てた分だけ上がる", () => {
    for (const isMenzenHand of [true, false]) {
      const fu = (extraFu: number) =>
        mentsuTehaiFu(extraFu, { winType: "tsumo", isMenzen: isMenzenHand });
      expect(fu(2)).toBe(30);
      expect(fu(8)).toBe(30);
      expect(fu(10)).toBe(40);
      expect(fu(18)).toBe(40);
      expect(fu(20)).toBe(50);
    }
  });

  it("門前ロンは30符から、積み上げた符を10で切り上げた分だけ上がる", () => {
    const fu = (extraFu: number) =>
      mentsuTehaiFu(extraFu, { winType: "ron", isMenzen: true });
    expect(fu(0)).toBe(30);
    expect(fu(2)).toBe(40);
    expect(fu(10)).toBe(40);
    expect(fu(12)).toBe(50);
    expect(fu(20)).toBe(50);
  });

  it("副露ロンは20符から、積み上げた符を10で切り上げた分だけ上がる", () => {
    const fu = (extraFu: number) =>
      mentsuTehaiFu(extraFu, { winType: "ron", isMenzen: false });
    expect(fu(2)).toBe(30);
    expect(fu(10)).toBe(30);
    expect(fu(12)).toBe(40);
    expect(fu(20)).toBe(40);
    expect(fu(22)).toBe(50);
  });

  it("食い平和形（副露・ロン・積み上げ0符）は20符ではなく30符になる", () => {
    expect(mentsuTehaiFu(0, { winType: "ron", isMenzen: false })).toBe(30);
  });

  /**
   * 教本の表がライブラリの符計算とずれていないことを、実際に生成した
   * 面子手で突き合わせる。mentsuTehaiFu は副底・和了の符・切り上げを
   * 教本の向き（積み上げた符 → 符）に組み直したものなので、
   * 手を作って符を出した結果と一致していなければならない。
   */
  it("生成した面子手（平和以外）の符と一致する", () => {
    let menzenChecked = 0;
    let furoChecked = 0;
    for (let i = 0; i < 8000; i++) {
      const question = generateScoreQuestion({
        includeFuro: true,
        includeChiitoi: false,
      });
      if (!question) continue;
      const yakuNames = (question.yakuDetails ?? []).map((yaku) => yaku.name);
      if (yakuNames.includes("平和")) continue;
      const details = question.fuDetails ?? [];
      if (details.length === 0) continue;

      const menzen = isMenzen(question.tehai);
      expect(
        mentsuTehaiFu(extraFuOf(details), {
          winType: question.isTsumo ? "tsumo" : "ron",
          isMenzen: menzen,
        }),
        `${menzen ? "門前" : "副露"} / ${JSON.stringify(details)}`,
      ).toBe(question.answer.fu);
      if (menzen) menzenChecked++;
      else furoChecked++;
    }
    expect(menzenChecked).toBeGreaterThan(500);
    expect(furoChecked).toBeGreaterThan(500);
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
