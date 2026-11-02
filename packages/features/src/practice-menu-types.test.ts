import { describe, expect, it } from "vitest";
import {
  ALL_VARIANT,
  DEFAULT_VARIANT,
  PRACTICE_MENU_TYPES,
  isPracticeMenuType,
  isPracticeVariant,
  practiceMenuBySlug,
  practiceMenuByType,
  resolveInitialPracticeVariant,
  resolvePracticeVariant,
} from "./practice-menu-types";

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

  it("ランキングに載せるバリアントは、選べるバリアントの重複の無い部分集合", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      const { variants, rankedVariants } = practiceMenuByType(menuType);
      for (const variant of rankedVariants) {
        expect(variants, `${menuType} の ${variant} が列挙に無い`).toContain(
          variant,
        );
      }
      expect(new Set(rankedVariants).size).toBe(rankedVariants.length);
    }
  });

  it("all を列挙した練習は all だけをランキングに載せる", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      const { variants, rankedVariants } = practiceMenuByType(menuType);
      if (!variants.includes(ALL_VARIANT)) continue;
      expect(rankedVariants, menuType).toEqual([ALL_VARIANT]);
    }
  });

  it("設定を持たない練習は default をランキングに載せる", () => {
    expect(practiceMenuBySlug("jantou-fu").rankedVariants).toEqual([
      DEFAULT_VARIANT,
    ]);
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

  describe("resolveInitialPracticeVariant", () => {
    it("URL の指定を保存値より優先する", () => {
      expect(resolveInitialPracticeVariant("total-fu", "all", "up_to_60")).toBe(
        "all",
      );
    });

    it("URL が無い・不正なら保存値を使う", () => {
      expect(
        resolveInitialPracticeVariant("total-fu", undefined, "up_to_60"),
      ).toBe("up_to_60");
      expect(
        resolveInitialPracticeVariant("total-fu", "bogus", "up_to_60"),
      ).toBe("up_to_60");
    });

    it("保存値も無い・列挙に無いなら既定に落とす", () => {
      expect(
        resolveInitialPracticeVariant("total-fu", undefined, undefined),
      ).toBe("up_to_40");
      expect(
        resolveInitialPracticeVariant("total-fu", undefined, "removed"),
      ).toBe("up_to_40");
    });
  });
});
