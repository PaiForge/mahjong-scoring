import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { KAZEHAI, SANGENHAI, SUIT_BASES } from "./constants";

describe("KAZEHAI", () => {
  it("風牌は4種", () => {
    expect(KAZEHAI).toHaveLength(4);
  });

  it("東南西北が含まれる", () => {
    expect(KAZEHAI).toContain(HaiKind.Ton);
    expect(KAZEHAI).toContain(HaiKind.Nan);
    expect(KAZEHAI).toContain(HaiKind.Sha);
    expect(KAZEHAI).toContain(HaiKind.Pei);
  });
});

describe("SANGENHAI", () => {
  it("三元牌は3種", () => {
    expect(SANGENHAI).toHaveLength(3);
  });

  it("白發中が含まれる", () => {
    expect(SANGENHAI).toContain(HaiKind.Haku);
    expect(SANGENHAI).toContain(HaiKind.Hatsu);
    expect(SANGENHAI).toContain(HaiKind.Chun);
  });
});

describe("SUIT_BASES", () => {
  it("数牌花色は3種", () => {
    expect(SUIT_BASES).toHaveLength(3);
  });

  it("各花色の1の牌IDが含まれる", () => {
    expect(SUIT_BASES).toContain(HaiKind.ManZu1);
    expect(SUIT_BASES).toContain(HaiKind.PinZu1);
    expect(SUIT_BASES).toContain(HaiKind.SouZu1);
  });
});
