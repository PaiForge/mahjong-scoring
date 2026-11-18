import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";

import {
  buildDemoScoreQuestion,
  DEMO_YAKUHAI_KOUTSU_HAND,
} from "./demo-score-question";
import { tehaiContextOf } from "./score-question-context";

describe("tehaiContextOf", () => {
  it("出題の直下にある和了状況を、手牌表示のコンテキストに組み替える", () => {
    const question = buildDemoScoreQuestion({
      hand: DEMO_YAKUHAI_KOUTSU_HAND,
      doraMarkers: [HaiKind.ManZu1],
      isRiichi: true,
      uraDoraMarkers: [HaiKind.PinZu9],
    });
    expect(tehaiContextOf(question)).toEqual({
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
      agariHai: DEMO_YAKUHAI_KOUTSU_HAND.agariHai,
      isTsumo: false,
      isRiichi: true,
      doraMarkers: [HaiKind.ManZu1],
      uraDoraMarkers: [HaiKind.PinZu9],
    });
  });

  it("リーチしていない出題は裏ドラを持たないまま渡す", () => {
    const question = buildDemoScoreQuestion({
      doraMarkers: [HaiKind.SouZu1],
      isRiichi: false,
    });
    const context = tehaiContextOf(question);
    expect(context.isRiichi).toBe(false);
    expect(context.isTsumo).toBe(true);
    expect(context.uraDoraMarkers).toBeUndefined();
  });
});
