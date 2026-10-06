import { ScorePracticeBoard } from "../../../practice/endless/score/score-practice-board";

/**
 * 点数計算総合演習 プレイ
 *
 * @description
 * 時計もミス上限も無く繰り返し解く練習の本体。設定に応じて役・翻・符・点数を
 * 答え、正誤と内訳を確認する。記録は残らない。
 *
 * @flow
 * 1. 開いたときの設定で問題を生成
 * 2. 手牌と条件を見て役・翻・符・点数を回答
 * 3. 答え合わせの後「次の問題へ」（自動で次へなら正解で即座に次の問題）
 * 4. 「終了する」で設定画面へ戻る
 */
export default function ScorePlayPage() {
  return <ScorePracticeBoard />;
}
