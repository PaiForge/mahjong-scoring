/**
 * 昇級試験の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （合格ラインが全受験者に同じ 1 本のため）。
 * その前提が成り立つのは出題が5翻以上に限定されている場合のみ:
 * 連風牌4符・切り上げ満貫はどちらも5翻未満の点数にしか影響しない。
 * ダブル役満・複合役満の設定は5翻以上の点数に影響するため、採否で正解が
 * 割れる手は境界除外（excludeYakumanRuleBoundary）で出題から外す。
 * ここでは出題条件のデータを守る。盤面がルール設定ストアを読まないことは
 * web 側の構造テスト（`rule-settings-independence.test.ts`）が守る。
 */
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import { practiceMenuByType } from "../../practice-menu-types";
import { EXAM_BOARD_CONFIG, EXAM_GENERATE_OPTIONS } from "./types";

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

describe("EXAM_BOARD_CONFIG", () => {
  it("盤面の翻訳名前空間は練習レジストリの試験の名前空間と同じで、辞書にある", () => {
    const { namespace } = practiceMenuByType("mangan_exam");
    expect(EXAM_BOARD_CONFIG.translationNamespace).toBe(namespace);
    expect(messages).toHaveProperty(namespace);
  });
});
