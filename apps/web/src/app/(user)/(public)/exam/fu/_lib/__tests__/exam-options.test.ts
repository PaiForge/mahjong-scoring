/**
 * 昇級試験（手牌の合計符）の出題条件の不変条件検証
 *
 * @description
 * 試験の公平性は「出題が端末ローカルのルール設定に依存しない」ことで成立する
 * （leaderboardKey を分けずに全受験者のベストスコアを同じ土俵で比較するため）。
 * 合計符に効くローカルルールは連風牌の雀頭（2符 / 4符）だけなので、その局面を
 * 出題しないことと、盤面がルール設定ストアを読まないことをここで守る。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateTotalFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { EXAM_GENERATE_OPTIONS, EXAM_GENERATION_MAX_RETRIES } from "../types";

describe("EXAM_GENERATE_OPTIONS", () => {
  it("連風牌（場風＝自風）の局面を出題しない", () => {
    expect(EXAM_GENERATE_OPTIONS.excludeRenfonpai).toBe(true);
  });

  it("この条件で生成した問題は場風と自風が必ず異なる", () => {
    for (let i = 0; i < 50; i++) {
      const question = retryGenerate(
        () => generateTotalFuQuestion(EXAM_GENERATE_OPTIONS),
        EXAM_GENERATION_MAX_RETRIES,
      );
      expect(question).toBeDefined();
      expect(question!.context.jikaze).not.toBe(question!.context.bakaze);
    }
  });

  it("生成予算が既定より大きい（盤面が生成待ちで固まらない）", () => {
    // 1回の試行あたりの成立率は約44%。既定の10では約0.3%/問で生成に失敗し、
    // 試験1回ぶんでは約3%が「答えられない問題」に当たる
    expect(EXAM_GENERATION_MAX_RETRIES).toBeGreaterThanOrEqual(100);
  });

  it("ルール設定（連風牌4符）を出題条件に含めない", () => {
    expect(EXAM_GENERATE_OPTIONS).not.toHaveProperty("renfonpaiAs4Fu");
  });
});

describe("試験盤面のルール設定非依存", () => {
  it("_components 配下のモジュールがルール設定ストアを import しない", () => {
    // total-fu の盤面を雛形にコピーすると use-rule-settings-store の import ごと
    // 持ち込みやすいため、構造で守る
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
