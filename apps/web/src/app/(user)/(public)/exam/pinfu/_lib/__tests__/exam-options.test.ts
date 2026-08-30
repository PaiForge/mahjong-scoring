/**
 * 昇級試験（平和の点数計算）の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で比較するため）。
 * 平和は役牌の雀頭を許さないので連風牌は関係せず、切り上げ満貫が効く
 * 30符4翻（平和ロンの4翻）は標準ルールで採点し、回答の選択肢も満貫未満に
 * 固定してある。ここでは出題条件のデータと、生成される問題が実際に
 * 「平和・20符または30符・満貫未満」に収まること、盤面がルール設定ストアを
 * 読まないことを守る。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { EXAM_GENERATE_OPTIONS, EXAM_GENERATION_MAX_RETRIES } from "../types";

/** 平和の符（ツモ = 副底のまま / ロン = 門前加符が乗る） */
const PINFU_FU = [20, 30];

describe("EXAM_GENERATE_OPTIONS", () => {
  it("平和の満貫未満に限定している", () => {
    expect(EXAM_GENERATE_OPTIONS.requiredYaku).toEqual(["平和"]);
    expect(EXAM_GENERATE_OPTIONS.allowedRanges).toEqual(["nonMangan"]);
  });

  it("符を平和の2通りに固定している", () => {
    // requiredYaku だけでは、役に平和が立つのに点数は暗刻側の解釈で出る手が
    // 混ざる（core の `allowedFu` 参照）。試験ではその手を出さない
    expect(EXAM_GENERATE_OPTIONS.allowedFu).toEqual(PINFU_FU);
  });

  it("ルール設定（連風牌4符・切り上げ満貫）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("kiriageMangan");
  });

  it("この条件で生成した問題はツモ20符・ロン30符に収まる", () => {
    for (let i = 0; i < 30; i++) {
      const question = generateValidScoreQuestion(
        EXAM_GENERATE_OPTIONS,
        EXAM_GENERATION_MAX_RETRIES,
      );
      expect(question).toBeDefined();
      expect(question!.answer.fu).toBe(question!.isTsumo ? 20 : 30);
      expect(question!.yakuDetails?.map((yaku) => yaku.name)).toContain("平和");
    }
  });

  it("生成予算が既定より大きい（盤面が生成待ちで固まらない）", () => {
    // 1回の試行あたりの成立率は約6.5%。既定の100では約0.12%/問で生成に失敗し、
    // 試験1回ぶんでは約1.2%が「答えられない問題」に当たる
    expect(EXAM_GENERATION_MAX_RETRIES).toBeGreaterThanOrEqual(500);
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("_components 配下のモジュールがルール設定ストアを import しない", () => {
    // 点数計算ドリルの盤面を雛形にコピーすると use-rule-settings-store の
    // import ごと持ち込みやすいため、構造で守る
    const componentsDir = join(__dirname, "..", "..", "_components");
    for (const file of readdirSync(componentsDir)) {
      const source = readFileSync(join(componentsDir, file), "utf8");
      expect(
        source.includes("use-rule-settings-store"),
        `${file} がルール設定ストアを import している`,
      ).toBe(false);
    }
  });
});
