import { describe, expect, it } from "vitest";
import { MentsuType } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

import {
  findAgariHighlight,
  type AgariHighlightItem,
} from "../find-agari-highlight";

/** 二索の暗刻（回答行1件分） */
const ANKO_2S: AgariHighlightItem = {
  id: "anko-2s",
  tiles: [19, 19, 19] as HaiKindId[],
  type: MentsuType.Koutsu,
  isOpen: false,
};

/** 一二三索の暗順子 */
const SHUNTSU_123S: AgariHighlightItem = {
  id: "shuntsu-123s",
  tiles: [18, 19, 20] as HaiKindId[],
  type: MentsuType.Shuntsu,
  isOpen: false,
};

/** 六筒の雀頭 */
const PAIR_6P: AgariHighlightItem = {
  id: "pair-6p",
  tiles: [14, 14] as HaiKindId[],
  type: "Pair",
  isOpen: false,
};

describe("findAgariHighlight", () => {
  it("和了牌を含む暗刻の右端に付ける", () => {
    expect(findAgariHighlight([ANKO_2S, PAIR_6P], 19)).toEqual({
      itemId: "anko-2s",
      tileIndex: 2,
    });
  });

  it("和了牌が順子の中ほどならその位置に付ける", () => {
    expect(findAgariHighlight([SHUNTSU_123S, PAIR_6P], 19)).toEqual({
      itemId: "shuntsu-123s",
      tileIndex: 1,
    });
  });

  it("単騎待ちなら雀頭に付ける", () => {
    expect(findAgariHighlight([ANKO_2S, PAIR_6P], 14)).toEqual({
      itemId: "pair-6p",
      tileIndex: 1,
    });
  });

  it("同じ牌種が暗刻と暗順子に跨るときは付けない", () => {
    // どちらを完成させた牌なのかが手牌から決まらない
    expect(
      findAgariHighlight([ANKO_2S, SHUNTSU_123S, PAIR_6P], 19),
    ).toBeUndefined();
  });

  it("副露・槓子には付けない", () => {
    const pon2s: AgariHighlightItem = {
      ...ANKO_2S,
      id: "pon-2s",
      isOpen: true,
    };
    const ankan2s: AgariHighlightItem = {
      id: "ankan-2s",
      tiles: [19, 19, 19, 19] as HaiKindId[],
      type: MentsuType.Kantsu,
      isOpen: false,
    };

    expect(findAgariHighlight([pon2s, PAIR_6P], 19)).toBeUndefined();
    expect(findAgariHighlight([ankan2s, PAIR_6P], 19)).toBeUndefined();
  });
});
