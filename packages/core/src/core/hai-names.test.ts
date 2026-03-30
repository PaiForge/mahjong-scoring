import { describe, it, expect } from "vitest";
import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { getKazeName, getHaiName } from "./hai-names";

describe("getKazeName", () => {
  it("東を返す", () => {
    expect(getKazeName(HaiKind.Ton)).toBe("東");
  });

  it("南を返す", () => {
    expect(getKazeName(HaiKind.Nan)).toBe("南");
  });

  it("西を返す", () => {
    expect(getKazeName(HaiKind.Sha)).toBe("西");
  });

  it("北を返す", () => {
    expect(getKazeName(HaiKind.Pei)).toBe("北");
  });
});

describe("getHaiName", () => {
  it("萬子の名前を正しく返す", () => {
    expect(getHaiName(HaiKind.ManZu1)).toBe("一萬");
    expect(getHaiName(HaiKind.ManZu5)).toBe("五萬");
    expect(getHaiName(HaiKind.ManZu9)).toBe("九萬");
  });

  it("筒子の名前を正しく返す", () => {
    expect(getHaiName(HaiKind.PinZu1)).toBe("一筒");
    expect(getHaiName(HaiKind.PinZu5)).toBe("五筒");
    expect(getHaiName(HaiKind.PinZu9)).toBe("九筒");
  });

  it("索子の名前を正しく返す", () => {
    expect(getHaiName(HaiKind.SouZu1)).toBe("一索");
    expect(getHaiName(HaiKind.SouZu5)).toBe("五索");
    expect(getHaiName(HaiKind.SouZu9)).toBe("九索");
  });

  it("風牌の名前を正しく返す", () => {
    expect(getHaiName(HaiKind.Ton)).toBe("東");
    expect(getHaiName(HaiKind.Nan)).toBe("南");
    expect(getHaiName(HaiKind.Sha)).toBe("西");
    expect(getHaiName(HaiKind.Pei)).toBe("北");
  });

  it("三元牌の名前を正しく返す", () => {
    expect(getHaiName(HaiKind.Haku)).toBe("白");
    expect(getHaiName(HaiKind.Hatsu)).toBe("發");
    expect(getHaiName(HaiKind.Chun)).toBe("中");
  });

  it("全34牌種すべてに名前が定義されている", () => {
    for (let i = 0; i <= 33; i++) {
      const name = getHaiName(i as HaiKindId);
      expect(name).not.toContain("?");
    }
  });

  it("範囲外のIDにはフォールバックを返す", () => {
    const name = getHaiName(99 as HaiKindId);
    expect(name).toBe("?99");
  });
});
