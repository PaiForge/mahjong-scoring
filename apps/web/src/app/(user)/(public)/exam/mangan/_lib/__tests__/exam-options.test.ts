/**
 * 昇級試験の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で比較するため）。
 * その前提が成り立つのは出題が5翻以上に限定されている場合のみ:
 * 連風牌4符・切り上げ満貫はどちらも5翻未満の点数にしか影響しない。
 * ここでは出題条件のデータと、盤面がルール設定ストアを読まないことを守る。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { EXAM_GENERATE_OPTIONS } from "../types";

describe("EXAM_GENERATE_OPTIONS", () => {
  it("翻数だけで点数が確定する手（5翻以上）に限定している", () => {
    expect(EXAM_GENERATE_OPTIONS.minHan).toBeGreaterThanOrEqual(MANGAN_MIN_HAN);
    expect(EXAM_GENERATE_OPTIONS.allowedRanges).toEqual(["manganPlus"]);
  });

  it("ルール設定（連風牌4符・切り上げ満貫）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("盤面を構成するモジュールがルール設定ストアを import しない", () => {
    // mangan-score-calculation の盤面を雛形にコピーすると
    // use-rule-settings-store の import ごと持ち込みやすいため、構造で守る
    // 盤面の中身は exam/_lib の共通ファクトリと exam/_components にあるため、
    // 級ごとの _components だけでなく共通レイヤも一緒に検査する
    const examRoot = join(__dirname, "..", "..", "..");
    const dirs = [
      join(__dirname, "..", "..", "_components"),
      join(examRoot, "_components"),
      join(examRoot, "_lib"),
    ];
    for (const dir of dirs) {
      for (const file of readdirSync(dir, { withFileTypes: true })) {
        if (!file.isFile()) continue;
        const source = readFileSync(join(dir, file.name), "utf8");
        expect(
          source.includes("use-rule-settings-store"),
          `${file.name} がルール設定ストアを import している`,
        ).toBe(false);
      }
    }
  });
});
