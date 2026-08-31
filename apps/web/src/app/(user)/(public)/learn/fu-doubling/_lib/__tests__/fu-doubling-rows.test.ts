import { describe, expect, it } from "vitest";
import type { Role, WinType } from "@mahjong-scoring/core";

import {
  buildFuPairRows,
  buildHanDoublingRows,
  FU_PAIRS,
} from "../fu-doubling-rows";

const ROLES: readonly Role[] = ["ko", "oya"];
const WIN_TYPES: readonly WinType[] = ["ron", "tsumo"];

describe("FU_PAIRS", () => {
  it("倍にした符が表に実在する組だけを持つ", () => {
    expect(FU_PAIRS).toEqual([
      { low: 20, high: 40 },
      { low: 25, high: 50 },
      { low: 30, high: 60 },
      { low: 40, high: 80 },
      { low: 50, high: 100 },
    ]);
  });
});

/**
 * この章の主張そのものの検査。
 *
 * 点数は「符 × 2^(翻+2)」から導かれ、100点単位への切り上げは掛け算の後に
 * 効くため、符を2倍にして翻を1つ下げた点数は切り上げ後もぴったり一致する。
 * core の点数導出（切り上げの位置や満貫の頭打ち）が変われば章の本文と表が
 * 同時に嘘になるので、ここで固定しておく。
 */
describe("符が倍になると1翻分ずれる", () => {
  it.each(
    ROLES.flatMap((role) =>
      WIN_TYPES.flatMap((winType) =>
        FU_PAIRS.map((pair) => ({ role, winType, pair })),
      ),
    ),
  )(
    "$pair.low符と$pair.high符（$role・$winType）は1翻ずらすと点数が一致する",
    ({ role, winType, pair }) => {
      const rows = buildFuPairRows(pair, role, winType);

      for (const lowCell of rows.low.filter((cell) => cell.linked)) {
        const highCell = rows.high.find((c) => c.han === lowCell.han - 1);
        expect(highCell?.score).toEqual(lowCell.score);
      }
    },
  );

  /**
   * 上の検査は「組になっているセルは一致する」しか見ないため、組が1つも
   * できていなければ素通りしてしまう。どの符の組も必ずどこかで組になることを
   * 別に固定しておく（20符はロンが存在しないのでツモでのみ組になる）。
   */
  it("どの符の組もツモかロンのどちらかでは必ず組になる", () => {
    for (const pair of FU_PAIRS) {
      const linked = WIN_TYPES.flatMap((winType) =>
        buildFuPairRows(pair, "ko", winType).low.filter((cell) => cell.linked),
      );
      expect(linked.length).toBeGreaterThan(0);
    }
  });
});

describe("buildFuPairRows", () => {
  it("25符の行を1翻分ずらすと50符の行になる（子のロン）", () => {
    const rows = buildFuPairRows({ low: 25, high: 50 }, "ko", "ron");

    // 25符1翻は存在しないので空欄
    expect(rows.low.map((cell) => cell.score?.ron)).toEqual([
      undefined,
      1600,
      3200,
      6400,
    ]);
    expect(rows.high.map((cell) => cell.score?.ron)).toEqual([
      1600, 3200, 6400, 8000,
    ]);
  });

  it("色を付けるセルは2行のあいだで1列ずれる", () => {
    const rows = buildFuPairRows({ low: 25, high: 50 }, "ko", "ron");

    expect(rows.low.filter((cell) => cell.linked).map((c) => c.han)).toEqual([
      2, 3, 4,
    ]);
    expect(rows.high.filter((cell) => cell.linked).map((c) => c.han)).toEqual([
      1, 2, 3,
    ]);
  });

  it("存在しない組は空欄になる（20符のロン）", () => {
    const rows = buildFuPairRows({ low: 20, high: 40 }, "ko", "ron");
    expect(rows.low.every((cell) => cell.score === undefined)).toBe(true);
  });

  it("満貫で頭打ちになったセルも組になる（40符4翻と80符3翻）", () => {
    const rows = buildFuPairRows({ low: 40, high: 80 }, "ko", "ron");

    const low4 = rows.low.find((cell) => cell.han === 4);
    const high3 = rows.high.find((cell) => cell.han === 3);
    expect(low4?.score?.isMangan).toBe(true);
    expect(high3?.score?.isMangan).toBe(true);
    expect(low4?.linked).toBe(true);
  });
});

describe("buildHanDoublingRows", () => {
  it("切り上げる前の点数は翻が1つ上がるごとにちょうど2倍になる", () => {
    const rows = buildHanDoublingRows(30, "ko");
    expect(rows.map((row) => row.beforeCeil)).toEqual([960, 1920, 3840, 7680]);
  });

  it("表に載る点数は切り上げのぶんだけ2倍からずれる", () => {
    const rows = buildHanDoublingRows(30, "ko");
    expect(rows.map((row) => row.ron)).toEqual([1000, 2000, 3900, 7700]);
  });

  it("親は子の1.5倍で、やはり倍々になる", () => {
    const rows = buildHanDoublingRows(30, "oya");
    expect(rows.map((row) => row.beforeCeil)).toEqual([
      1440, 2880, 5760, 11520,
    ]);
  });
});
