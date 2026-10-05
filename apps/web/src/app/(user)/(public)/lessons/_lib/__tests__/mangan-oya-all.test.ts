import { describe, expect, it } from "vitest";
import { HIGH_SCORES } from "@mahjong-scoring/core";

/**
 * 親のツモ（満貫以上）の章の主張そのものの検査。
 *
 * 章は「親のロンを3で割ればオールの数字になる」と言い切り、図もその場で
 * 割り算をしている（切り上げを挟まない）。満貫以上の親のロンがどれも3で
 * 割り切れることが、その言い切りの前提になる。
 *
 * 満貫未満では成り立たない。切り上げが親のロンとオールに別々に効くため、
 * 割った値が点数表と食い違う枠が出る。だから章は満貫以上に閉じている。
 */
describe("親のロンを3で割るとオールになる（満貫以上）", () => {
  it("どの区分でも割り切れ、点数表のオールと一致する", () => {
    expect(HIGH_SCORES.length).toBeGreaterThan(0);

    for (const row of HIGH_SCORES) {
      expect(row.ronOya % 3, row.nameKey).toBe(0);
      expect(row.tsumoOya.type, row.nameKey).toBe("oyaTsumo");
      if (row.tsumoOya.type !== "oyaTsumo") continue;
      expect(row.ronOya / 3, row.nameKey).toBe(row.tsumoOya.all);
    }
  });
});
