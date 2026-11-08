import { describe, expect, it } from "vitest";

import { isHaiKindId, type HaiKindId } from "@mahjong-scoring/core";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { tileNameKey } from "./tile-name-key";

/** 牌種 ID 0〜33 のすべて（ライブラリは一覧を公開していないので範囲から作る） */
const ALL_HAI_KIND_IDS: readonly HaiKindId[] = Array.from(
  { length: 34 },
  (_, i) => i,
).filter(isHaiKindId);

// 日本語の辞書の値がライブラリの既定（getHaiName）と同じであることは、ライブラリに
// 依存する web の tile-alt.test.ts がこの関数を通して固定する（features は
// @pai-forge/mahjong-react-ui に依存しない）
describe("tileNameKey", () => {
  it("34 種すべてを相異なるキーに写す", () => {
    expect(ALL_HAI_KIND_IDS).toHaveLength(34);
    const keys = new Set(ALL_HAI_KIND_IDS.map(tileNameKey));
    expect(keys.size).toBe(34);
  });

  it("写した先のキーの集合が日本語・英語の辞書の common.tileNames のキーと一致する", () => {
    const keys = [...new Set(ALL_HAI_KIND_IDS.map(tileNameKey))].sort();
    expect(Object.keys(jaMessages.common.tileNames).sort()).toEqual(keys);
    expect(Object.keys(enMessages.common.tileNames).sort()).toEqual(keys);
  });

  it("日本語の辞書は漢字の牌名を引ける（例: 一萬・五筒・九索・東・中）", () => {
    expect(jaMessages.common.tileNames[tileNameKey(0)]).toBe("一萬");
    expect(jaMessages.common.tileNames[tileNameKey(13)]).toBe("五筒");
    expect(jaMessages.common.tileNames[tileNameKey(26)]).toBe("九索");
    expect(jaMessages.common.tileNames[tileNameKey(27)]).toBe("東");
    expect(jaMessages.common.tileNames[tileNameKey(33)]).toBe("中");
  });

  it("英語の辞書は数牌を「数 + 色」、字牌を英語の名前で引ける", () => {
    expect(enMessages.common.tileNames[tileNameKey(0)]).toBe("1 man");
    expect(enMessages.common.tileNames[tileNameKey(13)]).toBe("5 pin");
    expect(enMessages.common.tileNames[tileNameKey(26)]).toBe("9 sou");
    expect(enMessages.common.tileNames[tileNameKey(27)]).toBe("East");
    expect(enMessages.common.tileNames[tileNameKey(33)]).toBe("Red dragon");
  });
});
