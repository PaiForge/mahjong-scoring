import { buildScoreQuestion, type ScoreQuestion } from "@mahjong-scoring/core";
import { ScoreLevel } from "@mahjong-scoring/core/core/constants";

import {
  buildDemoScoreQuestion,
  type DemoScoreQuestionOptions,
} from "../board/demo-score-question";

/**
 * デモの盤面を本番と同じ採点の経路に通す
 * 試験のデモ問題テスト用の採点ヘルパー
 *
 * デモの出題は正解を持たない（描画専用）ので、盤面に出る手牌・状況から
 * 出題と同じ `buildScoreQuestion` で採点し直す。このモジュールはテスト専用。
 */
export function scoreDemo(options: DemoScoreQuestionOptions): ScoreQuestion {
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
export function isInRange(range: string, scoreLevel: string): boolean {
  if (range === "nonMangan") return scoreLevel === ScoreLevel.Normal;
  if (range === "manganPlus") return scoreLevel !== ScoreLevel.Normal;
  return false;
}
