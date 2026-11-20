import { describe, expect, it } from "vitest";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
} from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";

import { HAN_COLS } from "./han-cols";
import {
  buildScoreGrid,
  FREQUENT_FU,
  FU_ROWS,
  highScoreCellId,
  normalCellId,
  scoreGridKey,
} from "./score-grid";

const ROLES: readonly Role[] = ["ko", "oya"];
const WIN_TYPES: readonly WinType[] = ["ron", "tsumo"];

describe("buildScoreGrid", () => {
  it("子のロンは 30 符 1 翻が 1000 点", () => {
    const grid = buildScoreGrid("ko", "ron", { kiriageMangan: false });
    expect(grid.get(scoreGridKey(1, 30))).toMatchObject({ ron: 1000 });
  });

  it("ロンの 20 符は存在しないのでグリッドに無い", () => {
    const grid = buildScoreGrid("oya", "ron", { kiriageMangan: false });
    expect(grid.has(scoreGridKey(2, 20))).toBe(false);
  });

  it("切り上げ満貫は 30 符 4 翻を満貫にする", () => {
    const off = buildScoreGrid("ko", "ron", { kiriageMangan: false });
    const on = buildScoreGrid("ko", "ron", { kiriageMangan: true });
    expect(off.get(scoreGridKey(4, 30))).toMatchObject({ ron: 7700 });
    expect(on.get(scoreGridKey(4, 30))).toMatchObject({ ron: 8000 });
  });

  it.each(
    ROLES.flatMap((role) =>
      WIN_TYPES.flatMap((winType) =>
        [false, true].map((kiriageMangan) => ({
          role,
          winType,
          kiriageMangan,
        })),
      ),
    ),
  )(
    "$role の $winType（切り上げ満貫 $kiriageMangan）は、存在する符×翻のすべてのセルが core の点数と一致する",
    ({ role, winType, kiriageMangan }) => {
      const grid = buildScoreGrid(role, winType, { kiriageMangan });
      const calculate = role === "ko" ? calculateKoScore : calculateOyaScore;
      const expected = FU_ROWS.flatMap((fu) =>
        HAN_COLS.filter((han) => !isInvalidCell(han, fu, winType)).map(
          (han) =>
            [
              scoreGridKey(han, fu),
              calculate(han, fu, { kiriageMangan }),
            ] as const,
        ),
      );
      expect([...grid.entries()]).toEqual(expected);
    },
  );
});

describe("scoreGridKey", () => {
  it("翻と符の組ごとに異なるキーになる", () => {
    const keys = FU_ROWS.flatMap((fu) =>
      HAN_COLS.map((han) => scoreGridKey(han, fu)),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("FREQUENT_FU", () => {
  it("頻出符は符×翻表の行にある符で、表の一部だけを強調する", () => {
    expect(FREQUENT_FU.size).toBeGreaterThan(0);
    expect(FREQUENT_FU.size).toBeLessThan(FU_ROWS.length);
    for (const fu of FREQUENT_FU) {
      expect(FU_ROWS).toContain(fu);
    }
  });
});

describe("セル ID", () => {
  it("符×翻表のセル ID は親子・和了方法・翻・符の組ごとに異なる", () => {
    const ids = ROLES.flatMap((role) =>
      WIN_TYPES.flatMap((winType) =>
        FU_ROWS.flatMap((fu) =>
          HAN_COLS.map((han) => normalCellId(role, winType, han, fu)),
        ),
      ),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("満貫以上の表のセル ID は親子・和了方法・区分の組ごとに異なり、符×翻表の ID と衝突しない", () => {
    const nameKeys = ["mangan", "haneman", "baiman"];
    const ids = ROLES.flatMap((role) =>
      WIN_TYPES.flatMap((winType) =>
        nameKeys.map((nameKey) => highScoreCellId(role, winType, nameKey)),
      ),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(normalCellId("ko", "ron", 1, 30));
  });
});
