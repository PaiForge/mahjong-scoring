/**
 * ヘルプツアーが照らす要素の `data-tour-id`
 * ツアー対象 ID
 *
 * 盤面の各部品が自分の要素に付け、ツアー（`machi-score-spotlight-tour.tsx`）が
 * 同じ値で引く。段階によって存在しない要素があり、ツアーは無いものを飛ばす。
 */
export const MACHI_SCORE_TOUR_ID = {
  /** 聴牌形の盤面（待ちを読む段階だけ。あとの段階では印を外す） */
  board: "machi-score-board",
  /** 待ち牌を選ぶ牌の一覧 */
  picker: "machi-score-picker",
  /** 待ちを回答する / 点数計算へ進むボタン */
  machiSubmit: "machi-score-machi-submit",
  /** 待ち × ツモ/ロン のマス表 */
  cells: "machi-score-cells",
  /** 翻・符・点数の回答欄 */
  answerForm: "machi-score-answer-form",
  /** 「役なし」ボタン */
  noYaku: "machi-score-no-yaku",
  /** 全マスの回答ボタン */
  cellsSubmit: "machi-score-cells-submit",
  /** 答え合わせのマス一覧 */
  resultSummary: "machi-score-result-summary",
  /** 答え合わせで選んだマスの内訳 */
  resultDetail: "machi-score-result-detail",
} as const;
