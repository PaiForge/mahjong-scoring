/**
 * 出題条件を適用して練習を始め直すときに、点数練習ストアへ書く差分を作る
 * 出題条件適用
 *
 * 和了形・聴牌形の点数計算のストアの `applyPracticeQuery` が共有する本体。
 * 条件をマージし、`appliedQuery` にクエリを控え、成績を戻し、前回の問題を
 * 消して回答の状態を初期に戻す。生成はしないので `generationFailed` も戻す。
 * 回答の状態（`initialAnswering`）の形はストアごとに違うため引数で受ける。
 *
 * @param state - 今のストアの出題条件と出題の連番
 * @param query - play のクエリ文字列（`appliedQuery` に控える）
 * @param options - 上書きする出題条件
 * @param initialAnswering - 1 問を解き始める前の回答の状態
 */
export function buildPracticeQueryReset<
  TOptions extends object,
  TAnswering extends object,
>(
  state: Readonly<{ options: TOptions; questionSeq: number }>,
  query: string,
  options: Readonly<Partial<TOptions>>,
  initialAnswering: TAnswering,
) {
  return {
    options: { ...state.options, ...options },
    appliedQuery: query,
    stats: { total: 0, correct: 0 },
    currentQuestion: undefined,
    ...initialAnswering,
    generationFailed: false,
    questionSeq: state.questionSeq + 1,
  };
}
