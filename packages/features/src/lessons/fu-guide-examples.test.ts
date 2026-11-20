import { describe, expect, it } from "vitest";

import {
  HaiKind,
  calculateJantouFu,
  calculateMachiFu,
  calculateStandaloneMentsuFu,
  type HaiKindId,
  type MachiType,
} from "@mahjong-scoring/core";

import {
  JANTOU_FU_EXAMPLES,
  MACHI_FU_EXAMPLES,
  MENTSU_FU_EXAMPLES,
  TEHAI_FU_EXAMPLES,
} from "./fu-guide-examples";
import {
  JANTOU_FU_SUMMARY_ROWS,
  MACHI_FU_SUMMARY_ROWS,
  MENTSU_FU_SUMMARY_ROWS,
} from "./fu-summary-rows";

// 例の符は core で計算した結果と突き合わせる（値を写して比べると、写し間違いも
// 一緒に通ってしまう）。牌そのものは描く側が決めた教材なので、ここに写さない。

const BAKAZE = HaiKind.Ton;
const JIKAZE = HaiKind.Nan;

const ALL_HAI_KINDS: ReadonlySet<number> = new Set(Object.values(HaiKind));

function expectValidTiles(tiles: readonly HaiKindId[], label: string): void {
  expect(tiles.length, label).toBeGreaterThan(0);
  for (const tile of tiles) {
    expect(ALL_HAI_KINDS.has(tile), label).toBe(true);
  }
}

/** 各例の符が、その章の早見表に載る符のどれかであること */
function expectFuInSummary(
  examples: Readonly<Record<string, { readonly fu: number }>>,
  rows: readonly { readonly fu: number }[],
): void {
  const summaryFu = new Set(rows.map((row) => row.fu));
  for (const [name, example] of Object.entries(examples)) {
    expect(summaryFu.has(example.fu), name).toBe(true);
  }
}

describe("雀頭の章の例", () => {
  it("各例は同じ牌 2 枚の対子で、東場・南家の雀頭として数えた符と一致する", () => {
    for (const [name, example] of Object.entries(JANTOU_FU_EXAMPLES)) {
      expectValidTiles(example.tiles, name);
      const [first, second] = example.tiles;
      expect(second, name).toBe(first);
      expect(calculateJantouFu(first, BAKAZE, JIKAZE), name).toBe(example.fu);
    }
  });

  it("各例の符は早見表に載る符のどれか", () => {
    expectFuInSummary(JANTOU_FU_EXAMPLES, JANTOU_FU_SUMMARY_ROWS);
  });
});

describe("面子の章の例", () => {
  it("各例の符は、その面子を単独で数えた符と一致する", () => {
    for (const [name, example] of Object.entries(MENTSU_FU_EXAMPLES)) {
      expectValidTiles(example.mentsu.hais, name);
      expect(calculateStandaloneMentsuFu(example.mentsu), name).toBe(
        example.fu,
      );
    }
  });

  it("早見表のどの符にも例がある", () => {
    const exampleFu = new Set(
      Object.values(MENTSU_FU_EXAMPLES).map((example) => example.fu),
    );
    for (const row of MENTSU_FU_SUMMARY_ROWS) {
      expect(exampleFu.has(row.fu), row.key).toBe(true);
    }
  });
});

/** 待ちの例のキーが表す待ちの形 */
const MACHI_EXAMPLE_TYPES: Readonly<
  Record<keyof typeof MACHI_FU_EXAMPLES, MachiType>
> = {
  kanchan: "Kanchan",
  penchan: "Penchan",
  tanki: "Tanki",
  ryanmen: "Ryanmen",
  shanpon: "Shanpon",
};

describe("待ちの章の例", () => {
  it("各例の符は、その待ちの形の符と一致する", () => {
    for (const [name, example] of Object.entries(MACHI_FU_EXAMPLES)) {
      expectValidTiles([...example.tiles, example.agariHai], name);
      const machiType =
        MACHI_EXAMPLE_TYPES[name as keyof typeof MACHI_FU_EXAMPLES];
      expect(calculateMachiFu(machiType), name).toBe(example.fu);
    }
  });

  it("早見表の待ちの形を 1 つずつ例に持つ", () => {
    expect(Object.keys(MACHI_FU_EXAMPLES)).toHaveLength(
      MACHI_FU_SUMMARY_ROWS.length,
    );
    expectFuInSummary(MACHI_FU_EXAMPLES, MACHI_FU_SUMMARY_ROWS);
  });
});

describe("手牌の章の例", () => {
  it("各例の牌は有効で、横向きにする位置は並べる牌の中にある", () => {
    for (const [name, example] of Object.entries(TEHAI_FU_EXAMPLES)) {
      expectValidTiles(example.tiles, name);
      if ("rotatedIndex" in example) {
        expect(example.rotatedIndex, name).toBeLessThan(example.tiles.length);
      }
    }
  });

  it("ロンの刻子の例はシャンポン待ち（和了牌の対子が手の内にある）", () => {
    const { tiles, agariHai } = TEHAI_FU_EXAMPLES.ronKoutsu;
    expect(tiles.filter((tile) => tile === agariHai)).toHaveLength(2);
  });

  it("風の 3 例は東場・南家の場風・自風・オタ風の対子", () => {
    const winds: readonly HaiKindId[] = [
      HaiKind.Ton,
      HaiKind.Nan,
      HaiKind.Sha,
      HaiKind.Pei,
    ];
    const { kazeBakaze, kazeJikaze, kazeOtakaze } = TEHAI_FU_EXAMPLES;
    expect(kazeBakaze.tiles).toEqual([BAKAZE, BAKAZE]);
    expect(kazeJikaze.tiles).toEqual([JIKAZE, JIKAZE]);
    const [otakaze, otakazePair] = kazeOtakaze.tiles;
    expect(otakazePair).toBe(otakaze);
    expect(winds).toContain(otakaze);
    expect([BAKAZE, JIKAZE]).not.toContain(otakaze);
  });
});
