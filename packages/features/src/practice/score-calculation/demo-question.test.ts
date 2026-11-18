import { describe, expect, it } from "vitest";
import { buildScoreQuestion } from "@mahjong-scoring/core";

import { SCORE_CALCULATION_DEMO_QUESTION } from "./demo-question";

const demo = SCORE_CALCULATION_DEMO_QUESTION;

describe("SCORE_CALCULATION_DEMO_QUESTION", () => {
  it("役一覧を提示しない出題形式なので役の内訳を持たない", () => {
    expect(demo.yakuDetails).toEqual([]);
  });

  it("出題と同じく表ドラ表示牌を 1 枚持つ", () => {
    expect(demo.doraMarkers).toHaveLength(1);
  });

  it("リーチしていない手なので裏ドラ表示牌を持たない", () => {
    expect(demo.isRiichi).toBe(false);
    expect(demo.uraDoraMarkers).toBeUndefined();
  });

  it("ドラは手牌に乗らず、平和・断么九・門前清自摸和の 3 翻になる", () => {
    const scored = buildScoreQuestion({
      tehai: demo.tehai,
      agariHai: demo.agariHai,
      isTsumo: demo.isTsumo,
      bakaze: demo.bakaze,
      jikaze: demo.jikaze,
      doraMarkers: demo.doraMarkers,
      ruleConfig: {},
    })._unsafeUnwrap();
    expect(scored.answer.han).toBe(3);
    expect((scored.yakuDetails ?? []).map((y) => y.name).sort()).toEqual(
      ["平和", "断么九", "門前清自摸和"].sort(),
    );
  });
});
