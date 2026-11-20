import { describe, expect, it } from "vitest";
import type { JudgementResult } from "@mahjong-scoring/core";

import { buildNoYakuResultRows } from "./no-yaku-result-rows";

/** 辞書の代わり。載っていないキーはキーのまま返す */
const dictionary =
  (entries: Readonly<Record<string, string>>) => (key: string) =>
    entries[key] ?? key;

const options = {
  t: dictionary({
    "cells.noYakuShort": "役なし",
    "result.notApplicable": "—",
  }),
  tScore: dictionary({
    "form.labels.yaku": "役",
    "form.labels.han": "翻数",
    "form.labels.fu": "符",
    "form.labels.score": "点数",
    "form.options.hanSuffix": "翻",
    "form.options.fuSuffix": "符",
    "form.options.mangan": "満貫",
    "result.details.none": "なし",
    "result.pointSuffix": "点",
  }),
  // 役名は core の日本語から辞書のキーへ引き直される（英語の辞書の例）
  tYakuNames: dictionary({ riichi: "Riichi", tanyao: "Tanyao" }),
  tCommon: dictionary({ listSeparator: "、" }),
  allowDoubleYakuman: false,
};

const ALL_FLAGS = { requireYaku: true, requireHanFu: true, exactHan: true };

const UNANSWERED = { kind: "unanswered" };

/** 役なしのマスに点数を当てはめた誤答の判定（役・点数は誤り、翻は正解扱いの例） */
const SCORE_RESULT: JudgementResult = {
  isCorrect: false,
  isHanCorrect: true,
  isFuCorrect: false,
  isScoreCorrect: false,
  isYakuCorrect: false,
};

describe("buildNoYakuResultRows", () => {
  it("正解の列は、役が「なし」・翻数が「役なし」・符と点数が「—」", () => {
    const rows = buildNoYakuResultRows(
      { ...ALL_FLAGS, userAnswer: undefined, result: undefined },
      options,
    );
    expect(
      rows.map(({ key, label, correct }) => [key, label, correct]),
    ).toEqual([
      ["yaku", "役", "なし"],
      ["han", "翻数", "役なし"],
      ["fu", "符", "—"],
      ["score", "点数", "—"],
    ]);
  });

  it("役を答えさせない出題では役の行を出さない", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        requireYaku: false,
        userAnswer: undefined,
        result: undefined,
      },
      options,
    );
    expect(rows.map((row) => row.key)).toEqual(["han", "fu", "score"]);
  });

  it("「わからない」での開示は、どの行も未回答の印", () => {
    const rows = buildNoYakuResultRows(
      { ...ALL_FLAGS, userAnswer: undefined, result: undefined },
      options,
    );
    expect(rows.map((row) => row.answer)).toEqual([
      UNANSWERED,
      UNANSWERED,
      UNANSWERED,
      UNANSWERED,
    ]);
  });

  it("役なしと答えたら翻数の行にだけ「役なし」と正誤を置き、他の行は未回答の印", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        userAnswer: { kind: "noYaku" },
        result: { ...SCORE_RESULT, isCorrect: true },
      },
      options,
    );
    expect(rows.map((row) => row.answer)).toEqual([
      UNANSWERED,
      { kind: "judged", value: "役なし", isCorrect: true },
      UNANSWERED,
      UNANSWERED,
    ]);
  });

  it("点数で答えた誤答は、行ごとに値と正誤を残す", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        userAnswer: {
          kind: "score",
          answer: { han: 2, fu: 40, score: 2600, yakus: ["立直", "断么九"] },
        },
        result: SCORE_RESULT,
      },
      options,
    );
    expect(rows.map((row) => row.answer)).toEqual([
      { kind: "judged", value: "Riichi、Tanyao", isCorrect: false },
      { kind: "judged", value: "2翻", isCorrect: true },
      { kind: "judged", value: "40符", isCorrect: false },
      { kind: "judged", value: "2600点", isCorrect: false },
    ]);
  });

  it("役を選ばずに点数で答えたら、役の行は「なし」を回答として出す", () => {
    const [yakuRow] = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        userAnswer: {
          kind: "score",
          answer: { han: 1, fu: 30, score: 1000, yakus: [] },
        },
        result: { ...SCORE_RESULT, isYakuCorrect: true },
      },
      options,
    );
    expect(yakuRow?.answer).toEqual({
      kind: "judged",
      value: "なし",
      isCorrect: true,
    });
  });

  it("翻数と符を答えさせない出題では、点数で答えても翻数と符の行は未回答の印", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        requireHanFu: false,
        userAnswer: {
          kind: "score",
          answer: { han: undefined, fu: undefined, score: 2600, yakus: [] },
        },
        result: SCORE_RESULT,
      },
      options,
    );
    expect(rows.map((row) => [row.key, row.answer.kind])).toEqual([
      ["yaku", "judged"],
      ["han", "unanswered"],
      ["fu", "unanswered"],
      ["score", "judged"],
    ]);
  });

  it("満貫以上で翻数や符を入れていない回答は「-」で出す", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        userAnswer: {
          kind: "score",
          answer: { han: undefined, fu: undefined, score: 8000, yakus: [] },
        },
        result: SCORE_RESULT,
      },
      options,
    );
    expect(rows.find((row) => row.key === "han")?.answer).toEqual({
      kind: "judged",
      value: "-",
      isCorrect: true,
    });
    expect(rows.find((row) => row.key === "fu")?.answer).toEqual({
      kind: "judged",
      value: "-符",
      isCorrect: false,
    });
  });

  it("区分名で出す出題（exactHan が false）では、5 翻の回答を「満貫」と出す", () => {
    const rows = buildNoYakuResultRows(
      {
        ...ALL_FLAGS,
        exactHan: false,
        userAnswer: {
          kind: "score",
          answer: { han: 5, fu: undefined, score: 8000, yakus: [] },
        },
        result: SCORE_RESULT,
      },
      options,
    );
    expect(rows.find((row) => row.key === "han")?.answer).toMatchObject({
      value: "満貫",
    });
  });
});
