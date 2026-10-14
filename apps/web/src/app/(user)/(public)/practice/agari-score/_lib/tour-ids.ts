/**
 * 和了形の点数計算の play 画面のヘルプツアーが照らす要素の `data-tour-id`
 * ツアー対象 ID
 *
 * 盤面と回答フォームが自分の要素に付け、ツアー（`agari-score-spotlight-tour.tsx`）が
 * 同じ値で引く。役の欄は設定で役の回答を求めるときだけ描かれ、ツアーは
 * 無いものを飛ばす。play 画面のツアーは答え合わせの段階を案内しない —
 * 「?」は出題文の横に置いていて、答え合わせの段階では出題文ごと消える。
 * 答え合わせで押せる値（役・点数）の案内は {@link AGARI_SCORE_RESULT_TOUR_ID}
 * を引くツアーが受け持つ。
 *
 * 回答フォーム（`ScorePracticeAnswerForm`）は聴牌形の点数計算も使うため、
 * その盤面にも同じ印が付くが、聴牌形のツアーはフォーム全体を 1 つの対象
 * （`TENPAI_SCORE_TOUR_ID.answerForm`）として照らすので、個々の欄の印は
 * 引かれないまま残るだけ。
 */
export const AGARI_SCORE_TOUR_ID = {
  /** 手牌と和了の条件（場風・自風・ドラ・ツモ/ロン） */
  board: "score-board",
  /** 役の選択欄（役の回答を求める設定のときだけ） */
  yaku: "score-yaku",
  /** 翻数の選択欄 */
  han: "score-han",
  /** 符の選択欄 */
  fu: "score-fu",
  /** 点数の選択欄（子のツモは子・親の 2 つ） */
  score: "score-score",
  /** 回答ボタン */
  submit: "score-submit",
  /** 「わからない」（無回答のまま正解を開示する） */
  reveal: "score-reveal",
} as const;

/**
 * 答え合わせの結果表のヘルプツアーが照らす要素の `data-tour-id`
 * 結果表ツアー対象 ID
 *
 * 結果表（`ResultDisplay`）が正解の列の役・点数のセルに付けるので、結果表を
 * 置くどの画面にも付く。引くのは早見表の連動サンプル（`/reference/demo`）の
 * ツアーだけで、練習の play 画面のツアーは答え合わせの段階を案内しない
 * （上の {@link AGARI_SCORE_TOUR_ID} の説明）。
 */
export const AGARI_SCORE_RESULT_TOUR_ID = {
  /** 正解の役（押すと役一覧がその役で開く） */
  yaku: "score-result-yaku",
  /** 正解の点数（押すと正解のマスに印を付けた点数表が開く） */
  score: "score-result-score",
} as const;
