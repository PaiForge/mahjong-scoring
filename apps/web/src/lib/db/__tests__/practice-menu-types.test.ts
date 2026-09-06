import { describe, expect, it } from "vitest";
import {
  DEFAULT_VARIANT,
  PRACTICE_MENU_TYPES,
  isPracticeMenuType,
  isPracticeVariant,
  practiceMenuBySlug,
  practiceMenuByType,
  resolvePracticeVariant,
} from "../practice-menu-types";

describe("isPracticeMenuType", () => {
  describe("valid menu types", () => {
    it.each(PRACTICE_MENU_TYPES)('returns true for "%s"', (menuType) => {
      expect(isPracticeMenuType(menuType)).toBe(true);
    });
  });

  describe("invalid string values", () => {
    it.each(["", "unknown", "jantou-fu", "JANTOU_FU", "score", "practice"])(
      'returns false for "%s"',
      (value) => {
        expect(isPracticeMenuType(value)).toBe(false);
      },
    );
  });

  describe("non-string values", () => {
    it.each([undefined, 0, 42, true, false, Symbol("test"), [], {}, () => {}])(
      "returns false for %s",
      (value) => {
        expect(isPracticeMenuType(value)).toBe(false);
      },
    );

    it("returns false for null", () => {
      expect(isPracticeMenuType(null)).toBe(false);
    });
  });
});

describe("バリアント", () => {
  it("設定を持たない練習は default の 1 件だけを持つ", () => {
    const { variants, hasSetup } = practiceMenuBySlug("jantou-fu");
    expect(hasSetup).toBe(false);
    expect(variants).toEqual([DEFAULT_VARIANT]);
  });

  it("バリアントを列挙した練習は default を含まない（キーの列が衝突しない）", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      const { hasSetup, variants } = practiceMenuByType(menuType);
      if (!hasSetup) continue;
      expect(variants, `${menuType} が default を列挙している`).not.toContain(
        DEFAULT_VARIANT,
      );
      expect(new Set(variants).size, `${menuType} のバリアントが重複`).toBe(
        variants.length,
      );
    }
  });

  it("キーは leaderboard_key（varchar(20)）に収まる snake_case", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      for (const variant of practiceMenuByType(menuType).variants) {
        expect(variant).toMatch(/^[a-z][a-z0-9_]{0,19}$/);
      }
    }
  });

  it("isPracticeVariant は (menuType, key) の組で判定する", () => {
    expect(isPracticeVariant("yaku_han", "kuisagari")).toBe(true);
    expect(isPracticeVariant("yaku_han", "default")).toBe(false);
    expect(isPracticeVariant("jantou_fu", "kuisagari")).toBe(false);
    expect(isPracticeVariant("jantou_fu", "default")).toBe(true);
  });

  it("resolvePracticeVariant は未指定・不正値を先頭（既定）に落とす", () => {
    expect(resolvePracticeVariant("yaku-han", undefined)).toBe("no_kuisagari");
    expect(resolvePracticeVariant("yaku-han", "bogus")).toBe("no_kuisagari");
    expect(resolvePracticeVariant("yaku-han", "all")).toBe("all");
    expect(resolvePracticeVariant("jantou-fu", "all")).toBe(DEFAULT_VARIANT);
  });
});
