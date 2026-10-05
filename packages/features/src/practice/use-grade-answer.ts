"use client";

import { useCallback } from "react";
import { AnswerOutcome } from "../results/result-schemas";
import { asHostedQuestion, useQuestionHost } from "./use-question-host";

/**
 * 回答を採点に回す
 * 採点
 *
 * 出題ホストがあれば回答をホストへ送り、採点済みの問題で `onGraded` を呼ぶ。
 * 無ければ手元の問題でそのまま `onGraded` を呼ぶ（その場で採点する）。
 *
 * 戻り値は回答を受け付けたか。盤面は true のときだけ「選んだ」印を立てる —
 * サーバー採点の待ち時間に押した印を出す一方で、受け付けなかった連打で
 * 印が別の選択肢へ動かないため
 */
export function useGradeAnswer<TQuestion>() {
  const host = useQuestionHost();
  return useCallback(
    (
      question: TQuestion,
      answer: unknown,
      onGraded: (question: TQuestion) => void,
    ): boolean => {
      if (!host) {
        onGraded(question);
        return true;
      }
      return host.grade(answer, (graded) =>
        onGraded(asHostedQuestion<TQuestion>(graded)),
      );
    },
    [host],
  );
}

/**
 * 採点 → 結果の記録 → 正誤の通知までを 1 つにした回答処理
 * 採点記録
 *
 * 盤面の回答の後段は「採点した問題から結果を作り、記録し、正誤と次問への
 * 進め方を `onAnswer` に渡す」で共通。結果の作り方（`toResult`）だけが盤面ごとに違う。
 *
 * @param toResult - 採点済みの問題と回答から結果を作る
 * @param handlers - 盤面の props（`onRecordResult` / `onAnswer`）と次問へ進む関数
 */
export function useGradeAndRecord<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
>(
  toResult: (question: TQuestion, answer: TAnswer) => TResult,
  {
    onRecordResult,
    onAnswer,
    advance,
  }: {
    readonly onRecordResult?: (result: TResult) => void;
    readonly onAnswer: (correct: boolean, onNext: () => void) => void;
    readonly advance: () => void;
  },
) {
  const gradeAnswer = useGradeAnswer<TQuestion>();
  return useCallback(
    (question: TQuestion, answer: TAnswer): boolean =>
      gradeAnswer(question, answer, (gradedQuestion) => {
        const result = toResult(gradedQuestion, answer);
        onRecordResult?.(result);
        onAnswer(result.outcome === AnswerOutcome.Correct, advance);
      }),
    [gradeAnswer, toResult, onRecordResult, onAnswer, advance],
  );
}
