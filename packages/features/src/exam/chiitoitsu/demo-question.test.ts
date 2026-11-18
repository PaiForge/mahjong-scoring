import { describe, expect, it } from "vitest";
import { buildScoreQuestion, type ScoreQuestion } from "@mahjong-scoring/core";
import { ScoreLevel } from "@mahjong-scoring/core/core/constants";

import {
  buildDemoScoreQuestion,
  type DemoScoreQuestionOptions,
} from "../../board/demo-score-question";
import { CHIITOITSU_EXAM_DEMO_OPTIONS } from "./demo-question";
import { EXAM_GENERATE_OPTIONS } from "./types";

/**
 * デモの盤面を本番と同じ採点の経路に通す
 *
 * デモの出題は正解を持たない（描画専用）ので、盤面に出る手牌・状況から
 * 出題と同じ `buildScoreQuestion` で採点し直す。
 */
function scoreDemo(options: DemoScoreQuestionOptions): ScoreQuestion {
  const demo = buildDemoScoreQuestion(options);
  return buildScoreQuestion({
    tehai: demo.tehai,
    agariHai: demo.agariHai,
    isTsumo: demo.isTsumo,
    jikaze: demo.jikaze,
    bakaze: demo.bakaze,
    doraMarkers: demo.doraMarkers,
    ruleConfig: { doubleWindJantouFu: 4, kiriageMangan: false },
    riichi: demo.isRiichi
      ? { uraDoraMarkers: demo.uraDoraMarkers ?? [] }
      : undefined,
  })._unsafeUnwrap();
}

/** 点数区分が出題の点数帯（`allowedRanges` の 1 つ）に入るか */
function isInRange(range: string, scoreLevel: string): boolean {
  if (range === "nonMangan") return scoreLevel === ScoreLevel.Normal;
  if (range === "manganPlus") return scoreLevel !== ScoreLevel.Normal;
  return false;
}

describe("CHIITOITSU_EXAM_DEMO_OPTIONS", () => {
  it("試験の点数帯（満貫未満）に入る手を見せる", () => {
    const { answer } = scoreDemo(CHIITOITSU_EXAM_DEMO_OPTIONS);
    for (const range of EXAM_GENERATE_OPTIONS.allowedRanges) {
      expect(isInRange(range, answer.scoreLevel), range).toBe(true);
    }
  });

  it("試験が必ず含める役を持つ手を見せる", () => {
    const names = scoreDemo(CHIITOITSU_EXAM_DEMO_OPTIONS).yakuDetails.map(
      (yaku) => yaku.name,
    );
    for (const yaku of EXAM_GENERATE_OPTIONS.requiredYaku) {
      expect(names).toContain(yaku);
    }
  });

  it("七対子・ドラ2 の 4 翻 25 符を見せる", () => {
    const { answer } = scoreDemo(CHIITOITSU_EXAM_DEMO_OPTIONS);
    expect([answer.han, answer.fu]).toEqual([4, 25]);
  });

  it("リーチしない手なので裏ドラ表示牌を盤面に出さない", () => {
    const demo = buildDemoScoreQuestion(CHIITOITSU_EXAM_DEMO_OPTIONS);
    expect(demo.isRiichi).toBe(false);
    expect(demo.uraDoraMarkers).toBeUndefined();
  });
});
