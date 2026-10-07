import { MachiScoreBoard } from "../../../practice/endless/machi-score/machi-score-board";

/**
 * 聴牌形の点数計算 プレイ
 *
 * @description
 * 聴牌形（13 枚）から待ち牌を読み、待ちごとにツモ・ロンの点数を答える
 * 練習の本体。時計もミス上限も無く、記録は残らない。
 *
 * @flow
 * 1. 開いたときの設定で問題を生成
 * 2. 待ち牌をすべて選んで回答（牌ごとに正誤を表示）
 * 3. 「点数計算へ進む」で待ち × ツモ/ロン のマスが出る（リーチなら裏ドラも開く）。
 *    マスを選んで翻・符・点数（役なしなら「役なし」）を当てはめ、全マス埋めて回答
 * 4. 答え合わせ（マスごとのタブと内訳）→「次の問題へ」
 *    （自動で次へなら待ち・全マス正解で即座に次の問題）
 * 5. 「終了する」で設定画面へ戻る
 */
export default function MachiScorePlayPage() {
  return <MachiScoreBoard />;
}
