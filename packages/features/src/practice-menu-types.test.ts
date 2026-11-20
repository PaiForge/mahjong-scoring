import {
  CHALLENGE_TIME_LIMIT,
  MISTAKE_LIMIT,
} from "@mahjong-scoring/core/challenge/constants";
import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";
import {
  ALL_VARIANT,
  DEFAULT_VARIANT,
  PRACTICE_MENU_SLUGS,
  PRACTICE_MENU_TYPES,
  PRACTICE_SLUG,
  isExamMenuType,
  isPracticeMenuSlug,
  isPracticeMenuType,
  isPracticeVariant,
  isPracticeVariantOf,
  menuTypeToMessageKey,
  menuTypeToSlug,
  practiceBoardKey,
  practiceMenuBySlug,
  practiceMenuByType,
  resolveInitialPracticeVariant,
  resolvePracticeVariant,
  resultStorageKeyFor,
  slugToMenuType,
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

/**
 * 辞書を練習のキーで引くための緩い形。キーはレジストリの値から組むので、
 * リテラル型の辞書のままでは添字にできない
 */
const dictionary = messages as unknown as {
  readonly practice: { readonly practices: Record<string, unknown> };
} & Record<string, unknown>;

/** 値をオブジェクトとして読む（無ければ空） */
function section(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

const descriptors = PRACTICE_MENU_TYPES.map((menuType) =>
  practiceMenuByType(menuType),
);

describe("レジストリの綴り", () => {
  // menuType は DB（snake_case）、slug は URL（kebab-case）、messageKey は
  // 辞書（camelCase）に載るので、それぞれの綴りの規則と一意性を確かめる
  it("menuType は重複の無い snake_case", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      expect(menuType).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
    expect(new Set(PRACTICE_MENU_TYPES).size).toBe(PRACTICE_MENU_TYPES.length);
  });

  it("slug は重複の無い kebab-case", () => {
    for (const slug of PRACTICE_MENU_SLUGS) {
      expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
    expect(new Set(PRACTICE_MENU_SLUGS).size).toBe(PRACTICE_MENU_SLUGS.length);
  });

  it("PRACTICE_SLUG の定数はレジストリの slug と同じ集合", () => {
    expect([...Object.values(PRACTICE_SLUG)].sort()).toEqual(
      [...PRACTICE_MENU_SLUGS].sort(),
    );
  });

  it("messageKey と namespace は重複の無い camelCase", () => {
    const messageKeys = descriptors.map(({ messageKey }) => messageKey);
    const namespaces = descriptors.map(({ namespace }) => namespace);
    for (const key of [...messageKeys, ...namespaces]) {
      expect(key).toMatch(/^[a-z]+([A-Z][a-z]+)*$/);
    }
    expect(new Set(messageKeys).size).toBe(messageKeys.length);
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });
});

describe("レジストリと辞書の対応", () => {
  it.each(PRACTICE_MENU_TYPES)(
    "%s の練習名が practice.practices.<messageKey> にある",
    (menuType) => {
      // 例: practice.practices.jantouFu.title
      const entry = section(
        dictionary.practice.practices[menuTypeToMessageKey(menuType)],
      );
      expect(typeof entry.title).toBe("string");
      expect(typeof entry.shortTitle).toBe("string");
    },
  );

  it.each(PRACTICE_MENU_TYPES)(
    "%s の練習ページの名前空間が辞書にあり title を持つ",
    (menuType) => {
      // 例: scoreTableChallenge.title
      const { namespace } = practiceMenuByType(menuType);
      expect(typeof section(dictionary[namespace]).title).toBe("string");
    },
  );

  it.each(PRACTICE_MENU_TYPES)(
    "%s のバリアントのラベルと説明が <namespace>.variants.<key> にある",
    (menuType) => {
      const { namespace, hasSetup, variants } = practiceMenuByType(menuType);
      if (!hasSetup) return;
      // 例: totalFu.variants.up_to_40.label
      const labels = section(section(dictionary[namespace]).variants);
      for (const variant of variants) {
        expect(typeof section(labels[variant]).label, variant).toBe("string");
        expect(typeof section(labels[variant]).hint, variant).toBe("string");
      }
    },
  );
});

describe("試験と練習の振り分け", () => {
  it("試験（menuType が _exam で終わる）は /exam の下、練習は /practice/<slug>", () => {
    for (const { menuType, slug, basePath } of descriptors) {
      if (menuType.endsWith("_exam")) {
        expect(basePath).toMatch(/^\/exam\/[a-z]+(-[a-z]+)*$/);
        expect(isExamMenuType(menuType)).toBe(true);
      } else {
        expect(basePath).toBe(`/practice/${slug}`);
        expect(isExamMenuType(menuType)).toBe(false);
      }
    }
  });

  it("2 つの練習が同じベースパスを共有しない", () => {
    const basePaths = descriptors.map(({ basePath }) => basePath);
    expect(new Set(basePaths).size).toBe(basePaths.length);
  });

  // 昇級判定は「ベストスコア >= 合格点」の単純比較で、1 ミスで終わることに依る
  it("試験は 1 ミスで終わり、練習は共通のミス上限を使う", () => {
    for (const { menuType, mistakeLimit } of descriptors) {
      expect(mistakeLimit).toBe(menuType.endsWith("_exam") ? 1 : MISTAKE_LIMIT);
    }
  });

  it("制限時間はどの練習も共通の値", () => {
    for (const { timeLimit } of descriptors) {
      expect(timeLimit).toBe(CHALLENGE_TIME_LIMIT);
    }
  });
});

describe("変換関数", () => {
  it("menuType と slug は往復して元に戻る", () => {
    for (const menuType of PRACTICE_MENU_TYPES) {
      expect(slugToMenuType(menuTypeToSlug(menuType))).toBe(menuType);
    }
  });

  it("slug と menuType の対応は記述子と一致する", () => {
    expect(menuTypeToSlug("score_table")).toBe("score-table");
    expect(slugToMenuType("mangan-exam")).toBe("mangan_exam");
    expect(practiceMenuBySlug("yaku-han").menuType).toBe("yaku_han");
    expect(practiceMenuByType("fu_exam").slug).toBe("fu-exam");
  });

  it("menuType から練習名の辞書キーを引く", () => {
    expect(menuTypeToMessageKey("score_table")).toBe("scoreTable");
    expect(practiceMenuByType("score_table").namespace).toBe(
      "scoreTableChallenge",
    );
  });

  it("知らない slug は menuType を持たない", () => {
    expect(slugToMenuType("agari-score")).toBeUndefined();
    expect(slugToMenuType("jantou_fu")).toBeUndefined();
    expect(isPracticeMenuSlug("jantou-fu")).toBe(true);
    expect(isPracticeMenuSlug("agari-score")).toBe(false);
  });

  it("結果の保存キーは slug ごとに分かれる", () => {
    expect(resultStorageKeyFor("machi-fu")).toBe("machi-fu-results");
  });

  it("土俵のキーは menuType と variant をコロンでつなぐ", () => {
    expect(practiceBoardKey({ menuType: "total_fu", variant: "all" })).toBe(
      "total_fu:all",
    );
  });

  it("isPracticeVariantOf は slug の列挙で判定する", () => {
    expect(isPracticeVariantOf("score-table", "oya_non_mangan")).toBe(true);
    expect(isPracticeVariantOf("score-table", "kuisagari")).toBe(false);
  });
});

describe("ランキングに載るバリアントの既定", () => {
  it("範囲を選べる練習は all だけをランキングに載せる", () => {
    expect(practiceMenuBySlug("score-table").rankedVariants).toEqual([
      ALL_VARIANT,
    ]);
  });

  // バリアントのキーは leaderboard_key・URL・辞書キーにそのまま載る
  it("既定と完成形のバリアントのキー", () => {
    expect(DEFAULT_VARIANT).toBe("default");
    expect(ALL_VARIANT).toBe("all");
  });
});
