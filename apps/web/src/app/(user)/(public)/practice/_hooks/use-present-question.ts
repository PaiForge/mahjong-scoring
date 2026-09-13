"use client";

import { useEffect } from "react";

/**
 * 出題中の問題をセッションに届け出る
 * 出題届け出
 *
 * 問題が変わるたびに、その問題を「回答なし」で組んだ結果を
 * `onPresentQuestion` に渡す。チャレンジのセッションはこれを預かり、答える
 * 前に制限時間が来たら時間切れの問題として結果に残す
 * （{@link import("./use-recorded-results").useRecordedResults}）。
 *
 * 盤面が出題状態を持つ場所（{@link import("./use-fu-choice-board").useFuChoiceBoard}
 * など）で呼ぶ。トレーニングや記録しない練習では `onPresentQuestion` が
 * 渡らないので何もしない。
 *
 * @param question - 出題中の問題。生成待ちは undefined
 * @param toUnanswered - 問題から回答なしの結果を組む。参照が変わるたびに
 *   届け直すため、安定した関数（モジュール定数か `useCallback`）を渡すこと
 * @param onPresentQuestion - 届け先。チャレンジのセッションが渡す
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
