import { describe, expect, it } from "vitest";
import { MentsuType, sortHaiCodes } from "@mahjong-scoring/core";

import { DEMO_FU_TEHAI } from "../../board/demo-tehai";
import {
  MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT,
  MENTSU_JANTOU_FU_DEMO_ITEMS,
} from "./demo-items";

describe("MENTSU_JANTOU_FU_DEMO_ITEMS", () => {
  it("行の id は空でなく、重複しない（和了牌の位置を id で指すため）", () => {
    const ids = MENTSU_JANTOU_FU_DEMO_ITEMS.map((item) => item.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("行の牌を合わせると、符の練習の共通デモ牌姿と同じ 14 枚になる", () => {
    const tiles = MENTSU_JANTOU_FU_DEMO_ITEMS.flatMap((item) => item.tiles);
    expect(sortHaiCodes(tiles)).toEqual(sortHaiCodes(DEMO_FU_TEHAI.closed));
  });

  it("デモ牌姿は副露を持たないので、どの行も門前（暗）として並べる", () => {
    expect(DEMO_FU_TEHAI.exposed).toEqual([]);
    for (const item of MENTSU_JANTOU_FU_DEMO_ITEMS) {
      expect(item.isOpen, item.id).toBe(false);
    }
  });

  it("行の種別は牌の形と合う（順子は連続する 3 枚・刻子は同じ 3 枚・雀頭は同じ 2 枚）", () => {
    for (const item of MENTSU_JANTOU_FU_DEMO_ITEMS) {
      const codes = item.tiles.map(Number);
      const first = codes[0] ?? Number.NaN;
      if (item.type === MentsuType.Shuntsu) {
        expect(codes, item.id).toEqual([first, first + 1, first + 2]);
      } else if (item.type === MentsuType.Koutsu) {
        expect(codes, item.id).toEqual([first, first, first]);
      } else {
        expect(item.type, item.id).toBe("Pair");
        expect(codes, item.id).toEqual([first, first]);
      }
    }
  });
});

describe("MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT", () => {
  it("デモの和了牌（七筒）を 567p の右端に示す", () => {
    expect(MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT).toEqual({
      itemId: "567p",
      tileIndex: 2,
    });
  });
});
