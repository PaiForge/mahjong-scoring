/**
 * 昇級試験の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で比較するため）。
 * その前提が成り立つのは出題が5翻以上に限定されている場合のみ:
 * 連風牌4符・切り上げ満貫はどちらも5翻未満の点数にしか影響しない。
 * ダブル役満・複合役満の設定は5翻以上の点数に影響するため、採否で正解が
 * 割れる手は境界除外（excludeYakumanRuleBoundary）で出題から外す。
 * ここでは出題条件のデータと、盤面がルール設定ストアを読まないことを守る。
 */
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { expectRuleSettingsIndependence } from "../../../_lib/__tests__/expect-rule-settings-independence";

import { EXAM_GENERATE_OPTIONS } from "../types";

describe("EXAM_GENERATE_OPTIONS", () => {
  it("翻数だけで点数が確定する手（5翻以上）に限定している", () => {
    expect(EXAM_GENERATE_OPTIONS.minHan).toBeGreaterThanOrEqual(MANGAN_MIN_HAN);
    expect(EXAM_GENERATE_OPTIONS.allowedRanges).toEqual(["manganPlus"]);
  });

  it("ルール設定（連風牌4符・切り上げ満貫・ダブル役満）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("yakumanRules");
  });

  it("役満ルールの採否で正解が割れる手を出題しない", () => {
    expect(EXAM_GENERATE_OPTIONS.excludeYakumanRuleBoundary).toBe(true);
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("盤面を構成するモジュールがルール設定ストアを import しない", () => {
    expectRuleSettingsIndependence("mangan");
  });
});
