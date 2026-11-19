import { describe, expect, it } from "vitest";
import {
  ALL_YAKUMAN_RULES_ENABLED,
  DEFAULT_RULE_SETTINGS,
  allowsDoubleYakuman,
  doubleWindJantouFu,
  toYakumanRuleConfig,
} from "./settings";
import { calculateKoScore } from "../core/score-table-math";

describe("DEFAULT_RULE_SETTINGS", () => {
  // 既定は標準ルール。端末に設定が無い利用者の符・点数がこれで決まる
  it("既定では連風牌の雀頭は 2 符", () => {
    expect(doubleWindJantouFu(DEFAULT_RULE_SETTINGS.renfonpaiAs4Fu)).toBe(2);
  });

  it("既定では 30 符 4 翻を満貫に切り上げない", () => {
    expect(
      calculateKoScore(4, 30, {
        kiriageMangan: DEFAULT_RULE_SETTINGS.kiriageMangan,
      }).ron,
    ).toBe(7700);
  });
});

describe("toYakumanRuleConfig", () => {
  it("既定のルール設定はすべて無効に変換される", () => {
    expect(toYakumanRuleConfig(DEFAULT_RULE_SETTINGS)).toEqual({
      suuankouTanki: false,
      daisuushii: false,
      kokushiMusouJuusanmen: false,
      junseiChuurenPoutou: false,
      fukugouYakuman: false,
    });
  });

  it("設定した形のフラグだけが有効になる", () => {
    expect(
      toYakumanRuleConfig({
        ...DEFAULT_RULE_SETTINGS,
        suuankouTankiDouble: true,
        fukugouYakuman: true,
      }),
    ).toEqual({
      suuankouTanki: true,
      daisuushii: false,
      kokushiMusouJuusanmen: false,
      junseiChuurenPoutou: false,
      fukugouYakuman: true,
    });
  });

  it("全設定を有効にすると ALL_YAKUMAN_RULES_ENABLED と一致する", () => {
    // 境界除外（excludeYakumanRuleBoundary）は ALL_YAKUMAN_RULES_ENABLED を
    // 「取りうる設定の上限」として使う。設定の形が増えたときに片方だけ
    // 更新されると境界の検出が漏れるため、両者の一致を保証する
    expect(
      toYakumanRuleConfig({
        ...DEFAULT_RULE_SETTINGS,
        suuankouTankiDouble: true,
        daisuushiiDouble: true,
        kokushiJuusanmenDouble: true,
        junseiChuurenDouble: true,
        fukugouYakuman: true,
      }),
    ).toEqual(ALL_YAKUMAN_RULES_ENABLED);
  });
});

describe("allowsDoubleYakuman", () => {
  it("未指定・全無効では false", () => {
    expect(allowsDoubleYakuman(undefined)).toBe(false);
    expect(allowsDoubleYakuman({})).toBe(false);
    expect(
      allowsDoubleYakuman(toYakumanRuleConfig(DEFAULT_RULE_SETTINGS)),
    ).toBe(false);
  });

  it("いずれかのフラグが有効なら true", () => {
    expect(allowsDoubleYakuman({ suuankouTanki: true })).toBe(true);
    expect(allowsDoubleYakuman({ daisuushii: true })).toBe(true);
    expect(allowsDoubleYakuman({ kokushiMusouJuusanmen: true })).toBe(true);
    expect(allowsDoubleYakuman({ junseiChuurenPoutou: true })).toBe(true);
    expect(allowsDoubleYakuman({ fukugouYakuman: true })).toBe(true);
  });
});
