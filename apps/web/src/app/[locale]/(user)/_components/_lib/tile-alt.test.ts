import { describe, expect, it } from "vitest";
import { getHaiName } from "@pai-forge/mahjong-react-ui";

import { isHaiKindId, type HaiKindId } from "@mahjong-scoring/core";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { tileNameKey } from "./tile-alt";

/** 牌種 ID 0〜33 のすべて（ライブラリは一覧を公開していないので範囲から作る） */
const ALL_HAI_KIND_IDS: readonly HaiKindId[] = Array.from(
  { length: 34 },
  (_, i) => i,
).filter(isHaiKindId);

describe("tileNameKey", () => {
  it("34 種すべてを相異なるキーに写す", () => {
    expect(ALL_HAI_KIND_IDS).toHaveLength(34);
    const keys = new Set(ALL_HAI_KIND_IDS.map(tileNameKey));
    expect(keys.size).toBe(34);
  });

  // 日本語の辞書の値がライブラリの alt の既定（getHaiName）と一致すること =
  // LocaleHai を経由しても日本語のページの alt が変わらないこと
  it.each(ALL_HAI_KIND_IDS)(
    "牌種 %i: 日本語の辞書の牌名がライブラリの既定の alt（getHaiName）と同じ",
    (hai) => {
      expect(jaMessages.common.tileNames[tileNameKey(hai)]).toBe(
        getHaiName(hai),
      );
    },
  );

  it("英語の辞書は数牌を「数 + 色」、字牌を英語の名前で引ける", () => {
    expect(enMessages.common.tileNames[tileNameKey(0)]).toBe("1 man");
    expect(enMessages.common.tileNames[tileNameKey(13)]).toBe("5 pin");
    expect(enMessages.common.tileNames[tileNameKey(26)]).toBe("9 sou");
    expect(enMessages.common.tileNames[tileNameKey(27)]).toBe("East");
    expect(enMessages.common.tileNames[tileNameKey(33)]).toBe("Red dragon");
  });
});
