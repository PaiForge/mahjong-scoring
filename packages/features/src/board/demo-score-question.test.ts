import { describe, expect, it } from "vitest";
import {
  buildScoreQuestion,
  HaiKind,
  sortHaiCodes,
} from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

import {
  buildDemoScoreQuestion,
  DEMO_CHIITOITSU_HAND,
  DEMO_MENTSU_HAND,
  DEMO_YAKUHAI_KOUTSU_HAND,
  defineDemoHand,
  type DemoHand,
} from "./demo-score-question";

/** デモ牌姿を、デモの出題と同じ状況（東場・南家・ドラが乗らない表示牌）で core に採点させる */
function scoreHand(hand: DemoHand): ScoreQuestion {
  const demo = buildDemoScoreQuestion({
    hand,
    doraMarkers: [HaiKind.SouZu1],
    isRiichi: false,
  });
  return buildScoreQuestion({
    tehai: demo.tehai,
    agariHai: demo.agariHai,
    isTsumo: demo.isTsumo,
    bakaze: demo.bakaze,
    jikaze: demo.jikaze,
    doraMarkers: demo.doraMarkers,
    ruleConfig: {},
  })._unsafeUnwrap();
}

function yakuNames(question: ScoreQuestion): readonly string[] {
  return (question.yakuDetails ?? []).map((yaku) => yaku.name).sort();
}

describe("defineDemoHand", () => {
  it("純手牌を理牌して持ち、和了牌と和了方法はそのまま残す", () => {
    const hand = defineDemoHand({
      closed: [HaiKind.SouZu5, HaiKind.ManZu2, HaiKind.PinZu3],
      agariHai: HaiKind.PinZu3,
      isTsumo: true,
    });
    expect(hand).toEqual({
      closed: sortHaiCodes([HaiKind.SouZu5, HaiKind.ManZu2, HaiKind.PinZu3]),
      agariHai: HaiKind.PinZu3,
      isTsumo: true,
    });
  });
});

describe("デモ牌姿", () => {
  it("面子手は門前ツモで平和・断么九・門前清自摸和が付く", () => {
    expect(yakuNames(scoreHand(DEMO_MENTSU_HAND))).toEqual(
      ["平和", "断么九", "門前清自摸和"].sort(),
    );
  });

  it("役牌の暗刻を持つ面子手は、ロンで役牌 1 翻だけの 1翻40符 = 1300 点になる", () => {
    const scored = scoreHand(DEMO_YAKUHAI_KOUTSU_HAND);
    expect(DEMO_YAKUHAI_KOUTSU_HAND.closed).toHaveLength(14);
    expect(scored.answer.han).toBe(1);
    expect(scored.answer.fu).toBe(40);
    expect(scored.answer.payment).toEqual({ type: "ron", amount: 1300 });
  });

  it("七対子の牌姿はロンで七対子だけが付く", () => {
    const scored = scoreHand(DEMO_CHIITOITSU_HAND);
    expect(DEMO_CHIITOITSU_HAND.closed).toHaveLength(14);
    expect(yakuNames(scored)).toEqual(["七対子"]);
    expect(scored.answer.payment.type).toBe("ron");
  });
});

describe("buildDemoScoreQuestion", () => {
  it("牌姿を省くと面子手を、南家・東場の盤面に並べる", () => {
    const question = buildDemoScoreQuestion({
      doraMarkers: [HaiKind.SouZu1],
      isRiichi: false,
    });
    expect(question.tehai.closed).toEqual(DEMO_MENTSU_HAND.closed);
    expect(question.agariHai).toBe(DEMO_MENTSU_HAND.agariHai);
    expect(question.isTsumo).toBe(DEMO_MENTSU_HAND.isTsumo);
    expect(question.jikaze).toBe(HaiKind.Nan);
    expect(question.bakaze).toBe(HaiKind.Ton);
    expect(question.yakuDetails).toEqual([]);
  });

  it("渡した牌姿・役の内訳・リーチと裏ドラをそのまま持たせる", () => {
    const yakuDetails = [{ name: "七対子", han: 2 }];
    const question = buildDemoScoreQuestion({
      hand: DEMO_CHIITOITSU_HAND,
      doraMarkers: [HaiKind.ManZu1],
      isRiichi: true,
      uraDoraMarkers: [HaiKind.PinZu9],
      yakuDetails,
    });
    expect(question.tehai.closed).toEqual(DEMO_CHIITOITSU_HAND.closed);
    expect(question.agariHai).toBe(DEMO_CHIITOITSU_HAND.agariHai);
    expect(question.isTsumo).toBe(false);
    expect(question.isRiichi).toBe(true);
    expect(question.doraMarkers).toEqual([HaiKind.ManZu1]);
    expect(question.uraDoraMarkers).toEqual([HaiKind.PinZu9]);
    expect(question.yakuDetails).toEqual(yakuDetails);
  });
});
