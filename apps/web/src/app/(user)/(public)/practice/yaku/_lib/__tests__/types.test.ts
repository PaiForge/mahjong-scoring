import { describe, expect, it } from "vitest";
import {
  generateYakuQuestion,
  parseHais,
  parseKazehai,
  parseTehai,
} from "@mahjong-scoring/core";

import { generateOrThrow } from "@/test/generate-or-throw";

import { parseYakuResults, toQuestionResult } from "../types";

/** 保存形式として妥当な結果データ */
const validResult = {
  tehai: "234m567p11122s678s",
  bakaze: "1z",
  jikaze: "2z",
  agariHai: "2s",
  isTsumo: true,
  isRiichi: false,
  doraMarkers: ["3p"],
  correctYakuNames: ["Tsumo", "Pinfu"],
  selectedYakuNames: ["Tsumo"],
  isCorrect: false,
};

describe("parseYakuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseYakuResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("undefined と壊れた JSON は空配列を返す", () => {
    expect(parseYakuResults(undefined)).toEqual([]);
    expect(parseYakuResults("{")).toEqual([]);
  });

  it("必須フィールドを欠く要素は除外する", () => {
    const { tehai: _omitted, ...broken } = validResult;
    const raw = JSON.stringify([validResult, broken]);
    expect(parseYakuResults(raw)).toHaveLength(1);
  });

  it("役名の配列でない要素は除外する", () => {
    const broken = { ...validResult, correctYakuNames: [1, 2] };
    expect(parseYakuResults(JSON.stringify([broken]))).toEqual([]);
  });

  it("ドラ表示牌が配列でない要素は除外する", () => {
    const broken = { ...validResult, doraMarkers: "3p" };
    expect(parseYakuResults(JSON.stringify([broken]))).toEqual([]);
  });
});

describe("toQuestionResult", () => {
  /** 生成できるまで試す（牌の残数不足で undefined を返しうるため） */
  function generate() {
    return generateOrThrow(generateYakuQuestion);
  }

  it("選んだ役と正誤を記録し、パースを通過する", () => {
    const question = generate();
    const selected = [...question.correctYakuNames];

    const result = toQuestionResult(question, selected, true);

    expect(result.isCorrect).toBe(true);
    expect(result.selectedYakuNames).toEqual(selected);
    expect(result.correctYakuNames).toEqual([...question.correctYakuNames]);
    expect(parseYakuResults(JSON.stringify([result]))).toHaveLength(1);
  });

  it("保存形式から出題内容（手牌・和了状況・ドラ）を復元できる", () => {
    // 結果ページはこの復元に依存して手牌を再表示する。役の成否はリーチと
    // ドラにも依存するため、手牌だけでは振り返れない。
    const question = generate();
    const result = toQuestionResult(question, [], false);

    const tehai = parseTehai(result.tehai);
    expect(tehai?.closed.length).toBe(question.tehai.closed.length);
    expect(tehai?.exposed.length).toBe(question.tehai.exposed.length);

    expect(parseKazehai(result.bakaze)).toBe(question.context.bakaze);
    expect(parseKazehai(result.jikaze)).toBe(question.context.jikaze);
    expect(parseHais(result.agariHai)[0]).toBe(question.context.agariHai);
    expect(result.isTsumo).toBe(question.context.isTsumo);
    expect(result.isRiichi).toBe(question.context.isRiichi);
    expect(result.doraMarkers.flatMap((m) => parseHais(m))).toEqual([
      ...question.context.doraMarkers,
    ]);
  });
});
