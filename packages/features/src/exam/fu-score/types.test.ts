/**
 * 昇級試験（30〜50符の点数計算）の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （合格ラインが全受験者に同じ 1 本のため）。
 * この試験は下の級と違って符を役で固定しないので、符が割れる唯一の点である
 * 連風牌（場風＝自風）を局面ごと出題から外して答えを1つに定めている。
 * ここでは出題条件のデータと、生成される問題が実際に「30〜50符・満貫未満・
 * 連風牌なし」に収まること、盤面がルール設定ストアを読まないことを守る。
 */
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import { practiceMenuByType } from "../../practice-menu-types";
import { EXAM_BOARD_CONFIG, EXAM_GENERATE_OPTIONS } from "./types";

/** 出題する符（面子手で最も多く現れる帯） */
const EXAM_FU = [30, 40, 50];

describe("EXAM_GENERATE_OPTIONS", () => {
  it("満貫未満の 30〜50符 に限定している", () => {
    expect(EXAM_GENERATE_OPTIONS.allowedRanges).toEqual(["nonMangan"]);
    expect(EXAM_GENERATE_OPTIONS.allowedFu).toEqual(EXAM_FU);
  });

  it("連風牌の局面を出題しない（符が割れる唯一の点を外す）", () => {
    expect(EXAM_GENERATE_OPTIONS.excludeRenfonpai).toBe(true);
  });

  it("役を絞り込まない（符を手牌から積み上げるのが主題）", () => {
    // 下の級の試験は requiredYaku で符を固定するが、この級では符そのものを
    // 受験者が出す。役を絞ると符の出方が偏る
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("requiredYaku");
  });

  it("鳴いた手も出題する（前提章に「鳴いた手の点数計算」を含むため）", () => {
    // 既定の includeFuro: true をそのまま使う。false に倒すと副露のロンが
    // 門前より10符低いことを問えなくなる
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("includeFuro");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("requireFuro");
  });

  it("ルール設定（連風牌4符・切り上げ満貫）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
  });

  it("この条件で生成した問題は満貫未満の 30〜50符 で連風牌を含まない", () => {
    for (let i = 0; i < 30; i++) {
      const question = generateValidScoreQuestion(EXAM_GENERATE_OPTIONS);
      expect(question).toBeDefined();
      expect(EXAM_FU).toContain(question!.answer.fu);
      expect(question!.jikaze).not.toBe(question!.bakaze);
    }
  });
});

describe("EXAM_BOARD_CONFIG", () => {
  it("盤面の翻訳名前空間は練習レジストリの試験の名前空間と同じで、辞書にある", () => {
    const { namespace } = practiceMenuByType("fu_score_exam");
    expect(EXAM_BOARD_CONFIG.translationNamespace).toBe(namespace);
    expect(messages).toHaveProperty(namespace);
  });
});
