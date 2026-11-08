/**
 * ヘルプツアーが照らす要素の `data-tour-id`
 * ツアー対象 ID
 *
 * 盤面の各部品が自分の要素に付け、ツアー（`tenpai-score-spotlight-tour.tsx`）が
 * 同じ値で引く。段階によって存在しない要素があり、ツアーは無いものを飛ばす。
 * 答え合わせの段階はタブと内訳だけなので案内する操作を持たない（「?」も
 * 出さない）。
 */
export const TENPAI_SCORE_TOUR_ID = {
  /** 聴牌形の盤面（待ちを読む段階だけ。あとの段階では印を外す） */
  board: "tenpai-score-board",
  /** 待ち牌を選ぶ牌の一覧 */
  picker: "tenpai-score-picker",
  /** 待ちを回答する / 点数計算へ進むボタン */
  machiSubmit: "tenpai-score-machi-submit",
  /** 待ち × ツモ/ロン のマス表 */
  cells: "tenpai-score-cells",
  /** 翻・符・点数の回答欄 */
  answerForm: "tenpai-score-answer-form",
  /** 全マスの回答ボタン */
  cellsSubmit: "tenpai-score-cells-submit",
} as const;
