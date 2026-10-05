"use client";

import { useEffect } from "react";
import { asHostedQuestion, useQuestionHost } from "./use-question-host";

/**
 * 出題中の問題をセッションに届け出る
 * 出題届け出
 *
 * 問題が変わるたびに、その問題を「回答なし」で組んだ結果を
 * `onPresentQuestion` に渡す。チャレンジのセッションはこれを預かり、答える
 * 前に制限時間が来たら時間切れの問題として結果に残す。
 *
 * 出題ホストがあるときは、ホストが時間切れの時点の問題を渡してくるので、
 * その受け取り先を登録するだけにする（盤面が出している問題は答えを伏せた
 * ものなので、ホストが明かした問題で結果を組む）。
 *
 * トレーニングや記録しない練習では `onPresentQuestion` が渡らないので何もしない。
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
  const register = useQuestionHost()?.registerUnanswered;
  useEffect(() => {
    if (!register || !onPresentQuestion) return;
    register((revealed) =>
      onPresentQuestion(toUnanswered(asHostedQuestion<TQuestion>(revealed))),
    );
    return () => register(undefined);
  }, [register, toUnanswered, onPresentQuestion]);
  useEffect(() => {
    if (register) return;
    if (question === undefined || onPresentQuestion === undefined) return;
    onPresentQuestion(toUnanswered(question));
  }, [question, toUnanswered, onPresentQuestion, register]);
}
