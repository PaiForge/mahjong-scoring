import { useLocalSearchParams } from "expo-router";
import { lessonScorePractice } from "@mahjong-scoring/features/practice/score/lesson-practices";

import { AgariScoreBoard } from "../../../practice/endless/agari-score/agari-score-board";

/**
 * 和了形の点数計算 プレイ
 *
 * @description
 * 時計もミス上限も無く繰り返し解く練習の本体。設定に応じて役・翻・符・点数を
 * 答え、正誤と内訳を確認する。記録は残らない。レッスンの「関連する練習」から
 * 開いたとき（`?lesson=<章の slug>`）は、その章の絞り込み（七対子だけ等）で出題する
 * （web は同じ絞り込みをクエリの `yaku` / `ranges` / `hand` で受ける）。
 *
 * @flow
 * 1. 開いたときの設定（または章の絞り込み）で問題を生成
 * 2. 手牌と条件を見て役・翻・符・点数を回答
 * 3. 答え合わせの後「次の問題へ」（自動で次へなら正解で即座に次の問題）
 * 4. 「終了する」で設定画面へ戻る
 */
export default function ScorePlayPage() {
  const { lesson } = useLocalSearchParams<{ lesson?: string }>();
  return <AgariScoreBoard pick={lessonScorePractice(lesson)?.pick} />;
}
