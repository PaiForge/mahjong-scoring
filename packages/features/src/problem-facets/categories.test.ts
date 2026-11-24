import { compareNumbers } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import {
  facetRowMatches,
  findProblemCategory,
  PROBLEM_CATEGORIES,
  PROBLEM_VALUE_CATEGORIES,
  NAMED_PROBLEM_CATEGORIES,
  PROBLEM_CATEGORY_GROUPS,
  problemMatchesCategory,
  SCORE_LEVELS,
  type FacetCondition,
} from "./categories";
import { computeProblemFacets, type ScoredFacetRow } from "./compute";
import {
  agariInput,
  noYakuAgariPayload,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  tenpaiInput,
} from "./test-fixtures";

/** 門前・子のロン: タンヤオ + 平和 + リーチ、3 翻 30 符、両面待ち */
const ROW: ScoredFacetRow = {
  agariHai: 10,
  isTsumo: false,
  result: "scored",
  han: 3,
  fu: 30,
  scoreLevel: "Normal",
  yakumanMultiplier: 0,
  points: 3900,
  yaku: ["Tanyao", "Pinfu", "Riichi"],
  doraHan: 0,
  uraDoraHan: 0,
  machi: "Ryanmen",
  variesByRenfonpai: false,
  variesByKiriage: false,
  variesByYakumanRules: false,
};
const MENZEN = { isMenzen: true };

function matches(condition: FacetCondition, row: Partial<ScoredFacetRow> = {}) {
  return facetRowMatches(condition, MENZEN, { ...ROW, ...row });
}

describe("facetRowMatches", () => {
  it("条件が空なら、採点できた和了はすべて満たす", () => {
    expect(matches({})).toBe(true);
  });

  it("役が無くロンできない和了は、条件が空でも満たさない", () => {
    expect(
      facetRowMatches({}, MENZEN, {
        agariHai: 10,
        isTsumo: false,
        result: "noYaku",
      }),
    ).toBe(false);
  });

  it("yakuAll は挙げた役をすべて含むときだけ満たす", () => {
    expect(matches({ yakuAll: ["Tanyao"] })).toBe(true);
    expect(matches({ yakuAll: ["Tanyao", "Riichi"] })).toBe(true);
    expect(matches({ yakuAll: ["Tanyao", "Iipeikou"] })).toBe(false);
  });

  it("yakuAny は挙げた役のどれかを含めば満たす", () => {
    expect(matches({ yakuAny: ["Iipeikou", "Pinfu"] })).toBe(true);
    expect(matches({ yakuAny: ["Iipeikou", "Toitoi"] })).toBe(false);
  });

  it("fuEq は一致、fuMin は以上", () => {
    expect(matches({ fuEq: 30 })).toBe(true);
    expect(matches({ fuEq: 40 })).toBe(false);
    expect(matches({ fuMin: 30 })).toBe(true);
    expect(matches({ fuMin: 20 })).toBe(true);
    expect(matches({ fuMin: 40 })).toBe(false);
  });

  it("machiIn は待ちの形が挙げたどれかのとき満たし、待ちの形を持たない和了は満たさない", () => {
    expect(matches({ machiIn: ["Ryanmen"] })).toBe(true);
    expect(matches({ machiIn: ["Kanchan", "Ryanmen"] })).toBe(true);
    expect(matches({ machiIn: ["Kanchan", "Penchan"] })).toBe(false);
    expect(matches({ machiIn: ["Tanki"] }, { machi: null })).toBe(false);
  });

  it("isTsumo はツモ/ロン、isMenzen は問題に共通の門前/副露で見る", () => {
    expect(matches({ isTsumo: false })).toBe(true);
    expect(matches({ isTsumo: true })).toBe(false);
    expect(matches({ isTsumo: true }, { isTsumo: true })).toBe(true);
    expect(matches({ isMenzen: true })).toBe(true);
    expect(matches({ isMenzen: false })).toBe(false);
    expect(facetRowMatches({ isMenzen: false }, { isMenzen: false }, ROW)).toBe(
      true,
    );
    expect(facetRowMatches({ isMenzen: true }, { isMenzen: false }, ROW)).toBe(
      false,
    );
  });

  it("scoreLevelIn は点数の区分が挙げたどれかのとき満たす", () => {
    expect(matches({ scoreLevelIn: ["Normal"] })).toBe(true);
    expect(matches({ scoreLevelIn: ["Mangan", "Haneman"] })).toBe(false);
    expect(
      matches(
        { scoreLevelIn: ["Mangan", "Haneman"] },
        { scoreLevel: "Haneman" },
      ),
    ).toBe(true);
  });

  it("複数の項目はすべて満たすときだけ真（AND）", () => {
    expect(matches({ yakuAll: ["Pinfu"], fuEq: 30, isTsumo: false })).toBe(
      true,
    );
    expect(matches({ yakuAll: ["Pinfu"], fuEq: 20, isTsumo: false })).toBe(
      false,
    );
    expect(matches({ yakuAll: ["Pinfu"], fuEq: 30, isTsumo: true })).toBe(
      false,
    );
  });
});

describe("problemMatchesCategory", () => {
  const riichiTenpai = computeProblemFacets(tenpaiInput(riichiTenpaiPayload()));
  const noYakuRonTenpai = computeProblemFacets(
    tenpaiInput(noYakuRonTenpaiPayload()),
  );

  it("any は、どれかの和了が条件を満たせば入る（ツモの 20 符だけが満たす条件）", () => {
    // 2・5・8p 待ちのリーチ・タンヤオ・平和。ツモは 20 符、ロンは 30 符
    expect(
      problemMatchesCategory(
        { condition: { fuEq: 20 }, tenpaiMatch: "any" },
        riichiTenpai,
      ),
    ).toBe(true);
    expect(
      problemMatchesCategory(
        { condition: { fuEq: 40 }, tenpaiMatch: "any" },
        riichiTenpai,
      ),
    ).toBe(false);
  });

  it("all は、すべての和了が条件を満たすときだけ入る", () => {
    expect(
      problemMatchesCategory(
        { condition: { yakuAll: ["Pinfu"] }, tenpaiMatch: "all" },
        riichiTenpai,
      ),
    ).toBe(true);
    expect(
      problemMatchesCategory(
        { condition: { fuEq: 20 }, tenpaiMatch: "all" },
        riichiTenpai,
      ),
    ).toBe(false);
  });

  it("条件は 1 つの和了の中でだけ組にする（別々の和了が満たしても入らない）", () => {
    // ツモ（20 符）とロン（30 符）にまたがる条件は、どの和了も満たさない
    expect(
      problemMatchesCategory(
        { condition: { fuEq: 20, isTsumo: false }, tenpaiMatch: "any" },
        riichiTenpai,
      ),
    ).toBe(false);
  });

  it("役なしのロンを持つ聴牌形は、any ならツモの和了で入り、all には入らない", () => {
    const condition = { yakuAll: ["MenzenTsumo"] } as const;
    expect(
      problemMatchesCategory(
        { condition, tenpaiMatch: "any" },
        noYakuRonTenpai,
      ),
    ).toBe(true);
    expect(
      problemMatchesCategory(
        { condition, tenpaiMatch: "all" },
        noYakuRonTenpai,
      ),
    ).toBe(false);
    // 役なしのロンは「ロン」の条件も満たさない
    expect(
      problemMatchesCategory(
        { condition: { isTsumo: false }, tenpaiMatch: "any" },
        noYakuRonTenpai,
      ),
    ).toBe(false);
  });

  it("和了の行を持たない問題は、all でも入らない", () => {
    expect(
      problemMatchesCategory(
        { condition: {}, tenpaiMatch: "all" },
        { set: riichiTenpai.set, rows: [] },
      ),
    ).toBe(false);
  });

  it("計算に失敗した問題はどの分類にも入らない", () => {
    const failed = computeProblemFacets(agariInput(noYakuAgariPayload()));
    for (const tenpaiMatch of ["any", "all"] as const) {
      expect(
        problemMatchesCategory({ condition: {}, tenpaiMatch }, failed),
      ).toBe(false);
    }
  });
});

describe("PROBLEM_CATEGORIES", () => {
  it("ID は重複せず、URL のクエリにそのまま使える文字だけでできている", () => {
    const ids = PROBLEM_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("どの分類も一覧にあるまとまりに属し、まとまりの順に並ぶ", () => {
    const order = PROBLEM_VALUE_CATEGORIES.map((category) =>
      PROBLEM_CATEGORY_GROUPS.indexOf(category.group),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort(compareNumbers));
  });

  it("どの分類・まとまりにも、管理画面の表示名が辞書にある（余りも無い）", () => {
    const dictionary = messages.admin.problemCategories;
    expect(Object.keys(dictionary.categories)).toEqual(
      PROBLEM_CATEGORIES.map((category) => category.id),
    );
    expect(Object.keys(dictionary.groups)).toEqual([
      ...PROBLEM_CATEGORY_GROUPS,
    ]);
  });

  it("満貫以上は、満貫から上のどの区分も含み、満貫未満を含まない", () => {
    const manganPlus = findProblemCategory("mangan-plus");
    if (!manganPlus) throw new Error("Missing category");
    expect(
      SCORE_LEVELS.filter((scoreLevel) =>
        matches(manganPlus.condition, { scoreLevel }),
      ),
    ).toEqual([
      "Mangan",
      "Haneman",
      "Baiman",
      "Sanbaiman",
      "Yakuman",
      "DoubleYakuman",
    ]);
  });

  it("単騎待ちの分類は、単騎の和了を持つ問題を含む", () => {
    const tanki = findProblemCategory("machi-tanki");
    if (!tanki) throw new Error("Missing category");
    expect(matches(tanki.condition, { machi: "Tanki" })).toBe(true);
    expect(matches(tanki.condition, { machi: "Shanpon" })).toBe(false);
  });

  it("ID から分類を引け、無い ID は undefined", () => {
    expect(findProblemCategory("yaku-pinfu")?.condition).toEqual({
      yakuAll: ["Pinfu"],
    });
    expect(findProblemCategory("unknown")).toBeUndefined();
    expect(findProblemCategory(null)).toBeUndefined();
    expect(findProblemCategory(undefined)).toBeUndefined();
  });

  it("公開 ID は固定され、旧 ID を別の意味に読み替えない", () => {
    expect(PROBLEM_CATEGORIES.map(({ id }) => id)).toEqual(ID_CONTRACT);
    for (const id of [
      "riichi",
      "pinfu",
      "yakuhai",
      "furo",
      "fu-50-plus",
      "machi-kanchan-penchan",
    ]) {
      expect(findProblemCategory(id)).toBeUndefined();
    }
  });

  it.each([20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110])(
    "%i 符はその値だけに分類し、満貫以上でも分類から除かない",
    (fu) => {
      const selected = PROBLEM_VALUE_CATEGORIES.filter(
        (category) =>
          category.group === "fu" &&
          matches(category.condition, { fu, scoreLevel: "Mangan" }),
      );
      expect(selected.map(({ id }) => id)).toEqual([`fu-${fu}`]);
    },
  );

  it("混一色と清一色は別の単一値で、両方が染め手に入る", () => {
    for (const [id, yaku] of [
      ["yaku-honitsu", "Honitsu"],
      ["yaku-chinitsu", "Chinitsu"],
    ] as const) {
      const selected = PROBLEM_CATEGORIES.filter(
        (category) =>
          category.group === "yaku" &&
          matches(category.condition, { yaku: [yaku] }),
      );
      expect(selected.map((category) => category.id)).toEqual([id, "somete"]);
    }
  });

  it.each([
    "Yakuhai",
    "Bakaze",
    "Jikaze",
    "Ton",
    "Nan",
    "Sha",
    "Pei",
    "Haku",
    "Hatsu",
    "Chun",
  ] as const)("役牌の内訳 %s は役牌の単一値へまとめる", (yaku) => {
    const selected = PROBLEM_VALUE_CATEGORIES.filter(
      (category) =>
        category.group === "yaku" &&
        matches(category.condition, { yaku: [yaku] }),
    );
    expect(selected.map(({ id }) => id)).toEqual(["yaku-yakuhai"]);
  });

  it("嵌張・辺張・単騎を分け、待ち符の束だけでまとめる", () => {
    const bundle = findProblemCategory("machi-fu-2")!;
    for (const [machi, id] of [
      ["Kanchan", "machi-kanchan"],
      ["Penchan", "machi-penchan"],
      ["Tanki", "machi-tanki"],
    ] as const) {
      expect(
        PROBLEM_VALUE_CATEGORIES.filter(
          (category) =>
            category.group === "machi" &&
            matches(category.condition, { machi }),
        ).map((category) => category.id),
      ).toEqual([id]);
      expect(matches(bundle.condition, { machi })).toBe(true);
    }
    for (const machi of ["Ryanmen", "Shanpon", null] as const)
      expect(matches(bundle.condition, { machi })).toBe(false);
  });

  it("聴牌形は同じ符軸に重複し、20 符とロンを別々の和了から組み合わせない", () => {
    const facets = computeProblemFacets(tenpaiInput(riichiTenpaiPayload()));
    expect(
      PROBLEM_VALUE_CATEGORIES.filter(
        (category) =>
          category.group === "fu" && problemMatchesCategory(category, facets),
      ).map(({ id }) => id),
    ).toEqual(["fu-20", "fu-30"]);
    expect(
      problemMatchesCategory(
        { condition: { fuEq: 20, isTsumo: false }, tenpaiMatch: "any" },
        facets,
      ),
    ).toBe(false);
  });

  it("名前付き条件は単一値から独立し、一覧のすべての分類は any で数える", () => {
    expect(NAMED_PROBLEM_CATEGORIES.map(({ id }) => id)).toEqual([
      "somete",
      "menzen-ron",
      "mangan-plus",
      "machi-fu-2",
    ]);
    expect(
      PROBLEM_CATEGORIES.every(({ tenpaiMatch }) => tenpaiMatch === "any"),
    ).toBe(true);
    expect(PROBLEM_VALUE_CATEGORIES.every(({ kind }) => kind === "value")).toBe(
      true,
    );
    expect(NAMED_PROBLEM_CATEGORIES.every(({ kind }) => kind === "named")).toBe(
      true,
    );
  });
});

/** 管理画面の URL 契約。生成規則の変更で既存 ID が変わることを防ぐ。 */
const ID_CONTRACT = [
  "yaku-tanyao",
  "yaku-pinfu",
  "yaku-iipeikou",
  "yaku-menzen-tsumo",
  "yaku-riichi",
  "yaku-yakuhai",
  "yaku-sanshoku-doujun",
  "yaku-ikkitsuukan",
  "yaku-honchan",
  "yaku-chiitoitsu",
  "yaku-toitoi",
  "yaku-sanankou",
  "yaku-sankantsu",
  "yaku-sanshoku-doukou",
  "yaku-honroutou",
  "yaku-shousangen",
  "yaku-honitsu",
  "yaku-junchan",
  "yaku-ryanpeikou",
  "yaku-chinitsu",
  "yaku-kokushi-musou",
  "yaku-suuankou",
  "yaku-daisangen",
  "yaku-shousuushii",
  "yaku-daisuushii",
  "yaku-tsuuiisou",
  "yaku-chinroutou",
  "yaku-ryuuiisou",
  "yaku-chuuren-poutou",
  "yaku-suukantsu",
  "fu-20",
  "fu-25",
  "fu-30",
  "fu-40",
  "fu-50",
  "fu-60",
  "fu-70",
  "fu-80",
  "fu-90",
  "fu-100",
  "fu-110",
  "machi-ryanmen",
  "machi-shanpon",
  "machi-kanchan",
  "machi-penchan",
  "machi-tanki",
  "agari-tsumo",
  "agari-ron",
  "menzen-true",
  "menzen-false",
  "level-normal",
  "level-mangan",
  "level-haneman",
  "level-baiman",
  "level-sanbaiman",
  "level-yakuman",
  "level-double-yakuman",
  "somete",
  "menzen-ron",
  "mangan-plus",
  "machi-fu-2",
];
