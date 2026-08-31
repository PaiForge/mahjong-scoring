/**
 * 昇級試験（七対子の点数計算）の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で比較するため）。
 * 七対子は雀頭を持たず符も常に25符なので、連風牌4符も切り上げ満貫も出題と
 * 点数のどちらにも効かない。ここでは出題条件のデータと、生成される問題が
 * 実際に「七対子・25符・満貫未満」に収まること、盤面がルール設定ストアを
 * 読まないことを守る。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { EXAM_GENERATE_OPTIONS } from "../types";

/** 七対子の符（常に固定。この試験の主題そのもの） */
const CHIITOITSU_FU = 25;

describe("EXAM_GENERATE_OPTIONS", () => {
  it("七対子の満貫未満に限定している", () => {
    expect(EXAM_GENERATE_OPTIONS.requiredYaku).toEqual(["七対子"]);
    expect(EXAM_GENERATE_OPTIONS.allowedRanges).toEqual(["nonMangan"]);
  });

  it("ルール設定（連風牌4符・切り上げ満貫）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
  });

  it("この条件で生成した問題は必ず七対子の25符・満貫未満になる", () => {
    // 符が25符に固定されることがこの試験の前提（受験者は符を計算せず
    // 25符の点数表を引く）。満貫以上が混ざると符が点数に効かなくなる
    for (let i = 0; i < 50; i++) {
      const question = generateValidScoreQuestion(EXAM_GENERATE_OPTIONS);
      expect(question).toBeDefined();
      expect(question!.answer.fu).toBe(CHIITOITSU_FU);
      expect(question!.yakuDetails?.map((yaku) => yaku.name)).toContain(
        "七対子",
      );
    }
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("盤面を構成するモジュールがルール設定ストアを import しない", () => {
    // 点数計算ドリルの盤面を雛形にコピーすると use-rule-settings-store の
    // import ごと持ち込みやすいため、構造で守る
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
