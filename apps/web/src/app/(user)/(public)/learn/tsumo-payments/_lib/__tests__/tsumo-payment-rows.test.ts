import { describe, expect, it } from "vitest";
import {
  calculateKoScore,
  calculateOyaScore,
  FU_VALUES,
  isInvalidCell,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

import {
  buildTsumoComparison,
  buildTsumoSplitRows,
} from "../tsumo-payment-rows";

/**
 * この章の主張そのものの検査。
 *
 * 子の和了で親が払う額と、親の和了で全員が払う額は、どちらも基本符の2倍から
 * 同じ式で出る。切り上げも同じ値に効くので、表に載る数字も必ず一致する。
 * 章は「例外なく一致する」と言い切っているため、符×翻の全セルで固定しておく。
 */
describe("親ツモのオール額は子ツモの親払い額と一致する", () => {
  it("符×翻のすべてのセルで一致する（例外なし）", () => {
    let checked = 0;

    for (const fu of FU_VALUES) {
      for (const han of HAN_COLS) {
        if (isInvalidCell(han, fu, "tsumo")) continue;

        const ko = calculateKoScore(han, fu).tsumo;
        const oya = calculateOyaScore(han, fu).tsumo;
        if (ko.type !== "koTsumo" || oya.type !== "oyaTsumo") {
          throw new Error("支払いの型が想定と違う");
        }

        expect(oya.all).toBe(ko.fromOya);
        checked += 1;
      }
    }

    // セルを1つも見ずに素通りしていないことを確かめる
    expect(checked).toBeGreaterThan(0);
  });
});

describe("buildTsumoSplitRows", () => {
  it("切り上げる前は親の払いがちょうど子の2倍になる", () => {
    for (const row of buildTsumoSplitRows(30)) {
      if (row.beforeCeil.type !== "koTsumo") throw new Error("型が違う");
      expect(row.beforeCeil.fromOya).toBe(row.beforeCeil.fromKo * 2);
    }
  });

  it("30符の切り上げ前は 240/480 から倍々に伸びる", () => {
    const rows = buildTsumoSplitRows(30);
    expect(
      rows.map((row) =>
        row.beforeCeil.type === "koTsumo"
          ? [row.beforeCeil.fromKo, row.beforeCeil.fromOya]
          : undefined,
      ),
    ).toEqual([
      [240, 480],
      [480, 960],
      [960, 1920],
      [1920, 3840],
    ]);
  });

  /**
   * 章が「表に載る数字では2倍にならないことがある」と書いている根拠。
   * 30符1翻は 300 と 500 で、300 の2倍の 600 にはならない。
   */
  it("切り上げ後は2倍にならない行がある（30符1翻の 300 と 500）", () => {
    const row = buildTsumoSplitRows(30).find((r) => r.han === 1);
    if (row?.actual.type !== "koTsumo") throw new Error("型が違う");
    expect([row.actual.fromKo, row.actual.fromOya]).toEqual([300, 500]);
    expect(row.actual.fromOya).not.toBe(row.actual.fromKo * 2);
  });

  it("存在しない組は行ごと落とす（20符ツモの1翻）", () => {
    expect(buildTsumoSplitRows(20).map((row) => row.han)).toEqual([2, 3, 4]);
  });
});

describe("buildTsumoComparison", () => {
  it("30符3翻は 1つ分1000点・2つ分2000点に展開される", () => {
    const c = buildTsumoComparison(30, 3);
    expect(c.unitAmount).toBe(1000);
    expect(c.sharedAmount).toBe(2000);
  });

  it("子の和了は子2人と親、親の和了は子3人が出す", () => {
    const c = buildTsumoComparison(30, 3);
    expect(c.koWin.map((e) => e.payer)).toEqual(["ko", "ko", "oya"]);
    expect(c.oyaWin.map((e) => e.payer)).toEqual(["ko", "ko", "ko"]);
  });

  /**
   * 章は「色の付いた支払いはどれも同じ額」と書いている。色を敷くのは shared の
   * 口なので、shared に立つ額が本当に1種類であることを固定しておく。
   */
  it("shared が立つ支払いはすべて同じ額になる", () => {
    for (const fu of [20, 25, 30, 40, 50, 60]) {
      for (const han of [2, 3, 4]) {
        const c = buildTsumoComparison(fu, han);
        const shared = [...c.koWin, ...c.oyaWin]
          .filter((e) => e.shared)
          .map((e) => e.amount);
        expect(new Set(shared)).toEqual(new Set([c.sharedAmount]));
        // 子の和了の親1口 + 親の和了の3口
        expect(shared).toHaveLength(4);
      }
    }
  });

  it("子ひとりの出す額は shared の額と別に持つ（切り上げでずれる場合がある）", () => {
    const c = buildTsumoComparison(30, 1);
    expect(c.unitAmount).toBe(300);
    expect(c.sharedAmount).toBe(500);
  });
});
