import { describe, expect, it } from "vitest";
import { FuroType, HaiKind, Tacha } from "@mahjong-scoring/core";

import { parseQuestionTiles } from "./parse-question-tiles";

/** 牌まわりのスナップショット（2.0 の表記） */
const SNAPSHOT = {
  tehai: "234m67888s[2-34s][6-78m]",
  agariHai: "2m",
  bakaze: "2z",
  jikaze: "1z",
};

describe("parseQuestionTiles", () => {
  it("手牌・和了牌・場風・自風を復元する", () => {
    const tiles = parseQuestionTiles(SNAPSHOT);

    expect(tiles?.agariHai).toBe(HaiKind.ManZu2);
    expect(tiles?.bakaze).toBe(HaiKind.Nan);
    expect(tiles?.jikaze).toBe(HaiKind.Ton);
    expect(tiles?.tehai.exposed).toHaveLength(2);
    expect(tiles?.tehai.exposed[0]?.furo).toEqual({
      type: FuroType.Chi,
      from: Tacha.Kamicha,
      nakiHai: HaiKind.SouZu2,
    });
  });

  it("1.x の表記で保存された手牌は例外にせず undefined にする", () => {
    // riichi-mahjong 0.x の頃に保存した結果（方向注釈の無い副露）。
    // 手牌の再表示だけを諦め、正誤の一覧は表示できるようにする
    const legacy = { ...SNAPSHOT, tehai: "234m67888s[234s][678m]" };
    expect(() => parseQuestionTiles(legacy)).not.toThrow();
    expect(parseQuestionTiles(legacy)).toBeUndefined();
  });

  it("赤 5 の表記は 5 として読む", () => {
    const tiles = parseQuestionTiles({ ...SNAPSHOT, tehai: "406m" });
    expect(tiles?.tehai.closed).toEqual([
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
    ]);
  });
});
