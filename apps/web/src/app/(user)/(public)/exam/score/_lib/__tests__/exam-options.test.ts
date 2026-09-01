/**
 * 昇段試験（あらゆる手の点数計算）の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題も選択肢も端末ローカルのルール設定に依存しない」ことで
 * 成立する（leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で
 * 比較するため）。この試験は出題範囲をまったく絞らないぶん、答えが1つに
 * 定まらない手 — 連風牌（符が割れる）と切り上げ満貫の境界（点数が割れる） —
 * を局面ごと落とすことだけで公平性を保つ。ここでは出題条件のデータと、
 * 生成される問題が実際にその2つを含まないこと、範囲を絞る条件を持たないこと、
 * 盤面がルール設定ストアを読まないことを守る。
 */
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { expectRuleSettingsIndependence } from "../../../_lib/__tests__/expect-rule-settings-independence";

import { EXAM_GENERATE_OPTIONS } from "../types";

/** 切り上げ満貫で点数が割れる手（符, 翻） */
const KIRIAGE_BOUNDARY: readonly (readonly [number, number])[] = [
  [30, 4],
  [60, 3],
];

describe("EXAM_GENERATE_OPTIONS", () => {
  it("出題の範囲を絞る条件を持たない（どんな手でも出るのが合格基準のため）", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("allowedRanges");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("allowedFu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("minHan");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("requiredYaku");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("includeFuro");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("requireFuro");
  });

  it("七対子を出題に含める（既定では出ないため明示的に開ける）", () => {
    expect(EXAM_GENERATE_OPTIONS.includeChiitoi).toBe(true);
  });

  it("答えが割れる局面（連風牌・切り上げ満貫の境界）を出題しない", () => {
    expect(EXAM_GENERATE_OPTIONS.excludeRenfonpai).toBe(true);
    expect(EXAM_GENERATE_OPTIONS.excludeKiriageBoundary).toBe(true);
  });

  it("ルール設定（連風牌4符・切り上げ満貫）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
  });

  it("この条件で生成した問題は連風牌も切り上げ満貫の境界も含まない", () => {
    for (let i = 0; i < 100; i++) {
      const question = generateValidScoreQuestion(EXAM_GENERATE_OPTIONS);
      expect(question).toBeDefined();
      expect(question!.jikaze).not.toBe(question!.bakaze);
      expect(
        KIRIAGE_BOUNDARY.some(
          ([fu, han]) =>
            question!.answer.fu === fu && question!.answer.han === han,
        ),
      ).toBe(false);
    }
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("盤面を構成するモジュールがルール設定ストアを import しない", () => {
    expectRuleSettingsIndependence("score");
  });
});
