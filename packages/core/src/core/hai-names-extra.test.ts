import { describe, it, expect } from "vitest";
import { HaiKind, type HaiKindId, type Tehai14 } from "@pai-forge/riichi-mahjong";
import { getDoraFromIndicator, countDoraInTehai, getKeyForKazehai } from "./hai-names";

describe("getDoraFromIndicator", () => {
  describe("萬子", () => {
    it("一萬表示 → 二萬がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.ManZu1);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.ManZu2);
    });

    it("八萬表示 → 九萬がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.ManZu8);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.ManZu9);
    });

    it("九萬表示 → 一萬がドラ（ループ）", () => {
      const result = getDoraFromIndicator(HaiKind.ManZu9);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.ManZu1);
    });
  });

  describe("筒子", () => {
    it("一筒表示 → 二筒がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.PinZu1);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.PinZu2);
    });

    it("九筒表示 → 一筒がドラ（ループ）", () => {
      const result = getDoraFromIndicator(HaiKind.PinZu9);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.PinZu1);
    });
  });

  describe("索子", () => {
    it("一索表示 → 二索がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.SouZu1);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.SouZu2);
    });

    it("九索表示 → 一索がドラ（ループ）", () => {
      const result = getDoraFromIndicator(HaiKind.SouZu9);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.SouZu1);
    });
  });

  describe("風牌", () => {
    it("東表示 → 南がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.Ton);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Nan);
    });

    it("南表示 → 西がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.Nan);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Sha);
    });

    it("西表示 → 北がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.Sha);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Pei);
    });

    it("北表示 → 東がドラ（ループ）", () => {
      const result = getDoraFromIndicator(HaiKind.Pei);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Ton);
    });
  });

  describe("三元牌", () => {
    it("白表示 → 發がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.Haku);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Hatsu);
    });

    it("發表示 → 中がドラ", () => {
      const result = getDoraFromIndicator(HaiKind.Hatsu);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Chun);
    });

    it("中表示 → 白がドラ（ループ）", () => {
      const result = getDoraFromIndicator(HaiKind.Chun);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(HaiKind.Haku);
    });
  });

  it("全34種の表示牌に対してOkを返す", () => {
    for (let i = 0; i <= 33; i++) {
      const result = getDoraFromIndicator(i as HaiKindId);
      expect(result.isOk()).toBe(true);
    }
  });
});

describe("countDoraInTehai", () => {
  it("ドラが手牌に含まれない場合0を返す", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6,
        HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.PinZu4, HaiKind.PinZu5,
      ],
      exposed: [],
    } as unknown as Tehai14;

    // 表示牌: 東 → ドラ: 南（手牌に南なし）
    expect(countDoraInTehai(tehai, [HaiKind.Ton])).toBe(0);
  });

  it("ドラが手牌の門前部分に含まれる場合カウントする", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1,
        HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4,
        HaiKind.ManZu5, HaiKind.ManZu6, HaiKind.ManZu7,
        HaiKind.ManZu8, HaiKind.ManZu9, HaiKind.PinZu1,
        HaiKind.PinZu1, HaiKind.PinZu1,
      ],
      exposed: [],
    } as unknown as Tehai14;

    // 表示牌: 九萬 → ドラ: 一萬（手牌に3枚）
    expect(countDoraInTehai(tehai, [HaiKind.ManZu9])).toBe(3);
  });

  it("副露部分のドラもカウントする", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.Ton, HaiKind.Ton,
      ],
      exposed: [
        { type: "Koutsu", hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5], furo: true },
      ],
    } as unknown as Tehai14;

    // 表示牌: 四萬 → ドラ: 五萬（副露に3枚）
    expect(countDoraInTehai(tehai, [HaiKind.ManZu4])).toBe(3);
  });

  it("複数のドラ表示牌を処理する", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu2, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.Ton, HaiKind.Ton, HaiKind.Ton,
        HaiKind.Nan, HaiKind.Nan,
      ],
      exposed: [],
    } as unknown as Tehai14;

    // 表示牌: 一萬(→ドラ二萬:2枚), 九筒(→ドラ一筒:0枚)
    expect(countDoraInTehai(tehai, [HaiKind.ManZu1, HaiKind.PinZu9])).toBe(2);
  });

  it("ドラ表示牌が空の場合0を返す", () => {
    const tehai = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6,
        HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.PinZu4, HaiKind.PinZu5,
      ],
      exposed: [],
    } as unknown as Tehai14;

    expect(countDoraInTehai(tehai, [])).toBe(0);
  });
});

describe("getKeyForKazehai", () => {
  it("東 → Ton", () => {
    expect(getKeyForKazehai(HaiKind.Ton)).toBe("Ton");
  });

  it("南 → Nan", () => {
    expect(getKeyForKazehai(HaiKind.Nan)).toBe("Nan");
  });

  it("西 → Sha", () => {
    expect(getKeyForKazehai(HaiKind.Sha)).toBe("Sha");
  });

  it("北 → Pei", () => {
    expect(getKeyForKazehai(HaiKind.Pei)).toBe("Pei");
  });
});
