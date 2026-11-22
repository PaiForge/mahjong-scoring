import { compareNumbers } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import {
  eligibleAgariPayload,
  kazoeYakumanAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
} from "../daily-problem/test-fixtures";

import {
  facetRowMatches,
  findProblemCategory,
  PROBLEM_CATEGORIES,
  PROBLEM_CATEGORY_GROUPS,
  problemMatchesCategory,
  SCORE_LEVELS,
  type FacetCondition,
} from "./categories";
import { computeProblemFacets, type ScoredFacetRow } from "./compute";
import {
  agariInput,
  kiriageOnlyWithRenfonpaiAgariPayload,
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
    const order = PROBLEM_CATEGORIES.map((category) =>
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
    expect(findProblemCategory("pinfu")?.condition).toEqual({
      yakuAll: ["Pinfu"],
    });
    expect(findProblemCategory("unknown")).toBeUndefined();
    expect(findProblemCategory(null)).toBeUndefined();
    expect(findProblemCategory(undefined)).toBeUndefined();
  });

  it("テスト盤面がそれぞれ見込んだ分類に入る", () => {
    const categoriesOf = (facets: ReturnType<typeof computeProblemFacets>) =>
      PROBLEM_CATEGORIES.filter((category) =>
        problemMatchesCategory(category, facets),
      ).map((category) => category.id);

    // リーチ・ツモ、2 翻 30 符、嵌張待ち
    expect(
      categoriesOf(computeProblemFacets(agariInput(eligibleAgariPayload()))),
    ).toEqual(["riichi", "fu-30", "machi-kanchan-penchan"]);
    // 白・ツモ、3 翻 30 符、両面待ち
    expect(
      categoriesOf(
        computeProblemFacets(agariInput(otherEligibleAgariPayload())),
      ),
    ).toEqual(["yakuhai", "fu-30", "machi-ryanmen"]);
    // リーチ・ツモ・ドラ 2、4 翻 30 符、双碰待ち
    expect(
      categoriesOf(
        computeProblemFacets(agariInput(kiriageBoundaryAgariPayload())),
      ),
    ).toEqual(["riichi", "fu-30", "machi-shanpon"]);
    // 白・リーチのロン、3 翻 50 符、嵌張待ち
    expect(
      categoriesOf(
        computeProblemFacets(
          agariInput(kiriageOnlyWithRenfonpaiAgariPayload()),
        ),
      ),
    ).toEqual([
      "riichi",
      "yakuhai",
      "fu-50-plus",
      "machi-kanchan-penchan",
      "menzen-ron",
    ]);
    // 清一色・一気通貫・平和・リーチ・ツモ（数え役満）
    expect(
      categoriesOf(
        computeProblemFacets(agariInput(kazoeYakumanAgariPayload())),
      ),
    ).toEqual([
      "riichi",
      "pinfu",
      "ikkitsuukan",
      "somete",
      "machi-ryanmen",
      "mangan-plus",
    ]);
    // 聴牌形: リーチ・タンヤオ・平和の三面待ち（ツモ 20 符 / ロン 30 符）
    expect(
      categoriesOf(computeProblemFacets(tenpaiInput(riichiTenpaiPayload()))),
    ).toEqual([
      "riichi",
      "tanyao",
      "pinfu",
      "fu-30",
      "machi-ryanmen",
      "menzen-ron",
    ]);
  });
});
