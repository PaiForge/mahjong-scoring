// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeProblemFacets } from "@mahjong-scoring/features/problem-facets/compute";
import { problemMatchesCategory } from "@mahjong-scoring/features/problem-facets/categories";
import {
  agariInput,
  kiriageOnlyWithRenfonpaiAgariPayload,
  riichiTenpaiPayload,
  tenpaiInput,
} from "@mahjong-scoring/features/problem-facets/test-fixtures";
import { parseProblemSearch, problemSearchQuery } from "./search";

const agari = computeProblemFacets(
  agariInput(kiriageOnlyWithRenfonpaiAgariPayload()),
);
const tenpai = computeProblemFacets(tenpaiInput(riichiTenpaiPayload()));

describe("保存問題の自由検索", () => {
  it("未検索と条件なしの全件検索を区別する", () => {
    expect(parseProblemSearch({})).toMatchObject({
      active: false,
    });
    expect(parseProblemSearch({}).query).toBeUndefined();
    expect(parseProblemSearch({ search: "1" })).toMatchObject({
      active: true,
      errors: [],
      query: { condition: {} },
    });
  });

  it("40 符以上・一通・単騎を同じ和了の条件へ変換する", () => {
    expect(
      parseProblemSearch({
        fuMin: "40",
        yaku: "yaku-ikkitsuukan",
        machi: "machi-tanki",
      }).query?.condition,
    ).toMatchObject({
      fuMin: 40,
      yakuAny: ["Ikkitsuukan"],
      machiIn: ["Tanki"],
    });
  });

  it("白とリーチの50符は、役牌とリーチをすべて含む検索に入る", () => {
    const state = parseProblemSearch({
      search: "1",
      yaku: ["yaku-yakuhai", "yaku-riichi"],
      yakuMode: "all",
      fuMin: "50",
      fuMax: "50",
      hanEq: "3",
    });
    expect(state.errors).toEqual([]);
    expect(state.query).toBeDefined();
    expect(
      problemMatchesCategory(
        { condition: state.query!.condition, tenpaiMatch: "any" },
        agari,
      ),
    ).toBe(true);
    const missing = parseProblemSearch({
      yaku: ["yaku-yakuhai", "yaku-ikkitsuukan"],
      yakuMode: "all",
    });
    expect(
      problemMatchesCategory(
        { condition: missing.query!.condition, tenpaiMatch: "any" },
        agari,
      ),
    ).toBe(false);
    const any = parseProblemSearch({
      yaku: ["yaku-yakuhai", "yaku-ikkitsuukan"],
      yakuMode: "any",
    });
    expect(
      problemMatchesCategory(
        { condition: any.query!.condition, tenpaiMatch: "any" },
        agari,
      ),
    ).toBe(true);
  });

  it("20 符のツモと30 符のロンをまたいで条件を満たさない", () => {
    const state = parseProblemSearch({ fu: "20", agari: "ron" });
    expect(
      problemMatchesCategory(
        { condition: state.query!.condition, tenpaiMatch: "any" },
        tenpai,
      ),
    ).toBe(false);
  });

  it.each([
    { fu: "35" },
    { fu: ["30", "bad"] },
    { fuMin: "-20" },
    { hanEq: "3.5" },
    { hanMin: "0" },
    { hanMax: "2147483648" },
    { hanEq: ["2", "3"] },
    { kind: "unknown" },
    { yaku: "yaku-ippatsu" },
    { machi: "Tanki" },
    { level: "bad" },
    { menzen: "yes" },
    { agari: "both" },
    { yakuMode: "bad" },
    { search: "0" },
    { fuMin: "60", fuMax: "40" },
    { hanMin: "4", hanMax: "2" },
    { fu: "30", fuMin: "20" },
    { hanEq: "3", hanMax: "4" },
    { search: "1", category: "fu-30" },
    { search: "1", flag: "kiriage" },
  ])("不正条件を外して検索を広げない: %j", (params) => {
    const state = parseProblemSearch(params);
    expect(state.active).toBe(true);
    expect(state.errors.length).toBeGreaterThan(0);
    expect(state.query).toBeUndefined();
  });

  it("エラー時にも修正できるよう入力を残す", () => {
    const state = parseProblemSearch({
      fuMin: "60",
      fuMax: "40",
      yaku: ["yaku-pinfu"],
    });
    expect(state.fields).toMatchObject({
      fuMin: "60",
      fuMax: "40",
      yaku: ["yaku-pinfu"],
    });
  });

  it("ページ送り用のURLで複数値・全条件が往復し、分類とページ番号を持ち込まない", () => {
    const original = parseProblemSearch({
      fu: ["30", "50", "30"],
      hanMin: "2",
      hanMax: "4",
      yaku: ["yaku-riichi", "yaku-yakuhai"],
      yakuMode: "all",
      machi: ["machi-tanki", "machi-kanchan"],
      level: "level-normal",
      agari: "ron",
      menzen: "true",
      kind: "tenpai-score",
    });
    const encoded = new URLSearchParams(problemSearchQuery(original.fields));
    const params = Object.fromEntries(
      [...new Set(encoded.keys())].map((key) => [
        key,
        encoded.getAll(key).length > 1
          ? encoded.getAll(key)
          : (encoded.get(key) ?? undefined),
      ]),
    );
    const roundTrip = parseProblemSearch(params);
    expect(roundTrip.errors).toEqual([]);
    expect(roundTrip.query).toEqual({
      ...original.query,
      condition: { ...original.query!.condition, fuIn: [30, 50] },
    });
    expect(encoded.has("page")).toBe(false);
    expect(encoded.has("category")).toBe(false);
  });
});
