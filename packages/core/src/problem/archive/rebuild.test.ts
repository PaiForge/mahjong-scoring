import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import { rebuildAgariQuestion, rebuildTenpaiQuestion } from "./rebuild";
import { STANDARD_RULES } from "./test-fixtures";
import type { AgariProblemPayload, TenpaiProblemPayload } from "./types";

/**
 * 組み立て直しは保存時の検証を通った盤面を読む想定だが、保存済みの行を
 * 直接読むため、検証を経ない値（範囲外の数値・壊れた副露）でも例外にせず
 * Err を返すことを確かめる。
 */

/** 222m 456p 789s 234s 東東 を 3s の嵌張でツモ。南家の東場・表ドラ表示牌は北 */
const AGARI: AgariProblemPayload = {
  hand: {
    closed: [1, 1, 1, 12, 13, 14, 19, 20, 21, 24, 25, 26, 27, 27],
    exposed: [],
  },
  agariHai: HaiKind.SouZu3,
  isTsumo: true,
  jikaze: HaiKind.Nan,
  bakaze: HaiKind.Ton,
  doraMarkers: [HaiKind.Pei],
  riichi: null,
};

/** 23m 456p 789s 234s 東東 の両面待ち（1m・4m）。南家の東場・表ドラ表示牌は北 */
const TENPAI: TenpaiProblemPayload = {
  hand: {
    closed: [1, 2, 12, 13, 14, 24, 25, 26, 19, 20, 21, 27, 27],
    exposed: [],
  },
  jikaze: HaiKind.Nan,
  bakaze: HaiKind.Ton,
  doraMarkers: [HaiKind.Pei],
  riichi: null,
};

describe("rebuildAgariQuestion", () => {
  it("正しい盤面は保存した和了牌・風・ツモで問題を組み立てる", () => {
    const question = rebuildAgariQuestion(
      AGARI,
      STANDARD_RULES,
    )._unsafeUnwrap();
    expect(question.agariHai).toBe(HaiKind.SouZu3);
    expect(question.jikaze).toBe(HaiKind.Nan);
    expect(question.bakaze).toBe(HaiKind.Ton);
    expect(question.isTsumo).toBe(true);
  });

  it("リーチした盤面は裏ドラ表示牌ごと組み立てる", () => {
    const question = rebuildAgariQuestion(
      { ...AGARI, riichi: { uraDoraMarkers: [HaiKind.ManZu1] } },
      STANDARD_RULES,
    )._unsafeUnwrap();
    expect(question.uraDoraMarkers).toEqual([HaiKind.ManZu1]);
  });

  it.each<[string, Partial<AgariProblemPayload>]>([
    [
      "純手牌に範囲外の牌",
      { hand: { closed: [...AGARI.hand.closed.slice(1), 34], exposed: [] } },
    ],
    [
      "壊れた副露",
      {
        hand: {
          closed: AGARI.hand.closed.slice(3),
          exposed: [{ type: "pon", hais: [1, 2, 3], from: "toimen" }],
        },
      },
    ],
    ["風でない自風", { jikaze: HaiKind.Haku }],
    ["範囲外の自風", { jikaze: 34 }],
    ["風でない場風", { bakaze: HaiKind.ManZu1 }],
    ["範囲外の表ドラ表示牌", { doraMarkers: [34] }],
    ["範囲外の裏ドラ表示牌", { riichi: { uraDoraMarkers: [-1] } }],
    ["範囲外の和了牌", { agariHai: 34 }],
  ])("%sを持つ盤面は invalidPayload", (_label, overrides) => {
    expect(
      rebuildAgariQuestion(
        { ...AGARI, ...overrides },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("invalidPayload");
  });

  it("和了形にならない手は invalidHand", () => {
    expect(
      rebuildAgariQuestion(
        {
          ...AGARI,
          hand: { closed: AGARI.hand.closed.slice(1), exposed: [] },
        },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("invalidHand");
  });

  it("和了牌が純手牌に無い盤面は agariHaiNotInHand", () => {
    expect(
      rebuildAgariQuestion(
        { ...AGARI, agariHai: HaiKind.Chun },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("agariHaiNotInHand");
  });

  it("副露のある手のリーチは riichiWithFuro", () => {
    expect(
      rebuildAgariQuestion(
        {
          ...AGARI,
          hand: {
            closed: AGARI.hand.closed.slice(3),
            exposed: [{ type: "pon", hais: [1, 1, 1], from: "toimen" }],
          },
          riichi: { uraDoraMarkers: [HaiKind.ManZu1] },
        },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("riichiWithFuro");
  });

  it("暗槓だけの門前の手のリーチは組み立てる", () => {
    const question = rebuildAgariQuestion(
      {
        ...AGARI,
        hand: {
          closed: AGARI.hand.closed.slice(3),
          exposed: [{ type: "ankan", hais: [1, 1, 1, 1] }],
        },
        doraMarkers: [HaiKind.Pei, HaiKind.Sha],
        riichi: { uraDoraMarkers: [HaiKind.ManZu1, HaiKind.ManZu9] },
      },
      STANDARD_RULES,
    );
    expect(question.isOk()).toBe(true);
  });

  it("役の無い和了形は組み立てずに採点の Err を返す", () => {
    // 222m 456p 789s 234s 東東 をロン。門前ロンで役が無い
    expect(
      rebuildAgariQuestion(
        { ...AGARI, isTsumo: false },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("noYaku");
  });
});

describe("rebuildTenpaiQuestion", () => {
  it("正しい盤面は待ちを列挙して組み立てる", () => {
    const question = rebuildTenpaiQuestion(
      TENPAI,
      STANDARD_RULES,
    )._unsafeUnwrap();
    expect(question.waits.map((wait) => wait.agariHai)).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu4,
    ]);
  });

  it.each<[string, Partial<TenpaiProblemPayload>]>([
    [
      "純手牌に範囲外の牌",
      { hand: { closed: [...TENPAI.hand.closed.slice(1), 34], exposed: [] } },
    ],
    ["風でない自風", { jikaze: HaiKind.Chun }],
    ["範囲外の場風", { bakaze: -1 }],
    ["範囲外の裏ドラ表示牌", { riichi: { uraDoraMarkers: [34] } }],
  ])("%sを持つ盤面は invalidPayload", (_label, overrides) => {
    expect(
      rebuildTenpaiQuestion(
        { ...TENPAI, ...overrides },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("invalidPayload");
  });

  it("聴牌形 13 枚にならない手は invalidHand", () => {
    expect(
      rebuildTenpaiQuestion(
        {
          ...TENPAI,
          hand: { closed: TENPAI.hand.closed.slice(1), exposed: [] },
        },
        STANDARD_RULES,
      )._unsafeUnwrapErr(),
    ).toBe("invalidHand");
  });
});
