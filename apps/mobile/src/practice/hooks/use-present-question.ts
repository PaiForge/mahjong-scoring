import { useEffect } from "react";

/**
 * 出題した問題を「回答なし」の結果として届け出る
 * 出題届け出
 *
 * 答える前に制限時間が来たとき、出題中の問題を時間切れとして結果の一覧に
 * 残すため。答えたら記録が上書きする（web の `usePresentQuestion` と同じ）。
 */
export function usePresentQuestion<TQuestion, TResult>(
  question: TQuestion | undefined,
  toUnanswered: (question: TQuestion) => TResult,
  onPresentQuestion: ((unanswered: TResult) => void) | undefined,
): void {
  useEffect(() => {
    if (question === undefined || onPresentQuestion === undefined) return;
    onPresentQuestion(toUnanswered(question));
  }, [question, toUnanswered, onPresentQuestion]);
}
