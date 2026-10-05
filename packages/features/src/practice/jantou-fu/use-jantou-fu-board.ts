"use client";

import { useCallback, useState } from "react";
import { generateJantouFuQuestion } from "@mahjong-scoring/core";
import type { JantouFuChoice, JantouFuQuestion } from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import { useGeneratedQuestion } from "../use-generated-question";
import { useGradeAnswer } from "../use-grade-answer";
import { usePresentQuestion } from "../use-present-question";
import { useRegisterAdvance } from "../use-training-mode";
import { toQuestionResult, type JantouFuQuestionResult } from "./types";

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: JantouFuQuestion,
): JantouFuQuestionResult {
  return toQuestionResult(question, undefined);
}

interface UseJantouFuBoardParams extends Pick<
  RecordingPracticeBoardProps<JantouFuQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /** 連風牌の雀頭を 4 符とするか（端末ローカルのルール設定） */
  readonly renfonpaiAs4Fu: boolean;
}

interface UseJantouFuBoardResult {
  /** 現在の問題。最初の問題はクライアントで生成するため、それまでは undefined */
  readonly question: JantouFuQuestion | undefined;
  /** 選んだ牌（未選択は undefined） */
  readonly selectedHai: JantouFuChoice["hai"] | undefined;
  readonly handleSelect: (index: number) => void;
}

/**
 * 雀頭符の練習の出題状態と回答ロジック
 * 雀頭符ボード
 *
 * 出題・選択・採点・結果の記録・次問への差し替えを持ち、盤面は描画だけをする。
 * チャレンジ・トレーニングの両モードと、web・モバイルの両方で共有する。
 */
export function useJantouFuBoard({
  renfonpaiAs4Fu,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: UseJantouFuBoardParams): UseJantouFuBoardResult {
  const gradeAnswer = useGradeAnswer<JantouFuQuestion>();
  const generateQuestion = useCallback(
    (): JantouFuQuestion => generateJantouFuQuestion({ renfonpaiAs4Fu }),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useGeneratedQuestion(generateQuestion);
  const [selectedHai, setSelectedHai] = useState<
    JantouFuChoice["hai"] | undefined
  >(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedHai(undefined);
  }, [generateQuestion, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const accepted = gradeAnswer(question, index, (gradedQuestion) => {
        const choice = gradedQuestion.choices[index];
        onRecordResult?.(toQuestionResult(gradedQuestion, choice));
        onAnswer(choice.isCorrect, advanceQuestion);
      });
      // 採点を待たずに選択を立てる（サーバー採点の待ち時間に押した印を出す）。
      // 牌は出題時点の問題にもあるので、採点済みの問題を待たなくてよい
      if (accepted) setSelectedHai(question.choices[index].hai);
    },
    [
      showFeedback,
      question,
      onAnswer,
      advanceQuestion,
      onRecordResult,
      gradeAnswer,
    ],
  );

  return { question, selectedHai, handleSelect };
}
