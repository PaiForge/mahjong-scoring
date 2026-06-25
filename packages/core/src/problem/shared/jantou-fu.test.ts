import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { calculateJantouFu } from "./jantou-fu";

describe("calculateJantouFu", () => {
  it("三元牌の雀頭は2符（renfonpaiAs4Fu に依存しない）", () => {
    expect(calculateJantouFu(HaiKind.Haku, HaiKind.Ton, HaiKind.Nan).fu).toBe(
      2,
    );
    expect(
      calculateJantouFu(HaiKind.Haku, HaiKind.Ton, HaiKind.Nan, true).fu,
    ).toBe(2);
  });

  it("単独の役風（場風のみ・自風のみ）の雀頭は2符", () => {
    // 場風のみ（bakaze=Ton, jikaze=Nan, tile=Ton）
    expect(calculateJantouFu(HaiKind.Ton, HaiKind.Ton, HaiKind.Nan).fu).toBe(2);
    // 自風のみ（bakaze=Nan, jikaze=Ton, tile=Ton）
    expect(calculateJantouFu(HaiKind.Ton, HaiKind.Nan, HaiKind.Ton).fu).toBe(2);
  });

  it("オタ風・数牌の雀頭は0符", () => {
    // オタ風（場風でも自風でもない）
    expect(calculateJantouFu(HaiKind.Sha, HaiKind.Ton, HaiKind.Nan).fu).toBe(0);
    // 数牌
    expect(calculateJantouFu(HaiKind.ManZu1, HaiKind.Ton, HaiKind.Nan).fu).toBe(
      0,
    );
  });

  describe("連風牌（場風＝自風）の雀頭", () => {
    it("既定（renfonpaiAs4Fu 未指定）では2符", () => {
      expect(calculateJantouFu(HaiKind.Ton, HaiKind.Ton, HaiKind.Ton).fu).toBe(
        2,
      );
    });

    it("renfonpaiAs4Fu=true では4符", () => {
      const res = calculateJantouFu(
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Ton,
        true,
      );
      expect(res.fu).toBe(4);
      expect(res.explanation).toContain("場風");
      expect(res.explanation).toContain("自風");
    });

    it("renfonpaiAs4Fu=false では2符", () => {
      expect(
        calculateJantouFu(HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, false).fu,
      ).toBe(2);
    });
  });
});
