import { describe, expect, it } from "vitest";
import { MentsuType } from "@mahjong-scoring/core";
import type { HaiKindId, TehaiFuQuestion } from "@mahjong-scoring/core";

import { findAgariHighlight } from "../find-agari-highlight";

/** 二索の暗刻（回答行1件分） */
const ANKO_2S = {
  id: "anko-2s",
  tiles: [19, 19, 19] as HaiKindId[],
  type: MentsuType.Koutsu,
  fu: 4,
  isOpen: false,
};

/** 一二三索の暗順子 */
const SHUNTSU_123S = {
  id: "shuntsu-123s",
  tiles: [18, 19, 20] as HaiKindId[],
  type: MentsuType.Shuntsu,
  fu: 0,
  isOpen: false,
};

/** 六筒の雀頭 */
const PAIR_6P = {
  id: "pair-6p",
  tiles: [14, 14] as HaiKindId[],
  type: "Pair" as const,
  fu: 0,
  isOpen: false,
};

function makeQuestion(
  items: TehaiFuQuestion["items"],
  agariHai: HaiKindId,
): TehaiFuQuestion {
  return {
    id: "q",
    tehai: { closed: [], exposed: [] } as unknown as TehaiFuQuestion["tehai"],
    context: { bakaze: 27, jikaze: 27, agariHai, isTsumo: false },
    items,
  };
}

describe("findAgariHighlight", () => {
  it("和了牌を含む暗刻の右端に付ける", () => {
    const question = makeQuestion([ANKO_2S, PAIR_6P], 19);

    expect(findAgariHighlight(question)).toEqual({
      itemId: "anko-2s",
      tileIndex: 2,
    });
  });

  it("和了牌が順子の中ほどならその位置に付ける", () => {
    const question = makeQuestion([SHUNTSU_123S, PAIR_6P], 19);

    expect(findAgariHighlight(question)).toEqual({
      itemId: "shuntsu-123s",
      tileIndex: 1,
    });
  });

  it("単騎待ちなら雀頭に付ける", () => {
    const question = makeQuestion([ANKO_2S, PAIR_6P], 14);

    expect(findAgariHighlight(question)).toEqual({
      itemId: "pair-6p",
      tileIndex: 1,
    });
  });

  it("同じ牌種が暗刻と暗順子に跨るときは付けない", () => {
    // どちらを完成させた牌なのかが手牌から決まらない
    const question = makeQuestion([ANKO_2S, SHUNTSU_123S, PAIR_6P], 19);

    expect(findAgariHighlight(question)).toBeUndefined();
  });

  it("副露・槓子には付けない", () => {
    const pon2s = { ...ANKO_2S, id: "pon-2s", isOpen: true, fu: 2 };
    const ankan2s = {
      id: "ankan-2s",
      tiles: [19, 19, 19, 19] as HaiKindId[],
      type: MentsuType.Kantsu,
      fu: 16,
      isOpen: false,
    };

    expect(
      findAgariHighlight(makeQuestion([pon2s, PAIR_6P], 19)),
    ).toBeUndefined();
    expect(
      findAgariHighlight(makeQuestion([ankan2s, PAIR_6P], 19)),
    ).toBeUndefined();
  });
});
