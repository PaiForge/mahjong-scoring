import { HaiKind } from "@mahjong-scoring/core";
import { QuestionDisplay } from "../../score/_components/question-display";
import { buildDemoScoreQuestion } from "../../_lib/demo-score-question";

/**
 * デモ用の固定例: 平和 + 断么九 + 門前清自摸和（子・門前ツモ・両面待ち）
 * 手牌・状況から点数を読み取る出題形式を示すため、ドラは手牌に乗らない
 * 二索（表示牌は一索）にして翻数を増やさない。
 */
const DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
});

/**
 * 点数計算練習の「問題方式」ビジュアルデモ
 * 点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況の提示）を静的に再現し、出題形式を端的に示す。
 */
export function ScoreCalculationHowToPlay() {
  return <QuestionDisplay question={DEMO_QUESTION} />;
}
