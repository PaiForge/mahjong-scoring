"use client";

import { useCallback, useState } from "react";
import { generateYakuQuestion, retryGenerate } from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import { useGeneratedQuestion } from "../use-generated-question";
import { useGradeAndRecord } from "../use-grade-answer";
import { usePresentQuestion } from "../use-present-question";
import { useRegisterAdvance, useTrainingMode } from "../use-training-mode";
import {
  QUESTION_GENERATION_MAX_RETRIES,
  toQuestionResult,
  type YakuQuestionResult,
} from "./types";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion, QUESTION_GENERATION_MAX_RETRIES);
}

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: YakuQuestion): YakuQuestionResult {
  return toQuestionResult(question, undefined);
}

/** 選んだ役を配列にして結果を組む（採点に送る回答も配列） */
function toResult(
  question: YakuQuestion,
  selected: readonly string[],
): YakuQuestionResult {
  return toQuestionResult(question, selected);
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set();

interface UseYakuBoardResult {
  /** 現在の問題。最初の問題はクライアントで生成するため、それまでは undefined */
  readonly question: YakuQuestion | undefined;
  readonly selectedYaku: ReadonlySet<string>;
  /** 出題番号（一覧のスクロール位置を問題ごとに戻す `key`） */
  readonly questionIndex: number;
  /**
   * 答え合わせを出すか（トレーニングで止まっている間だけ。開示・回答後の
   * どちらでも）。チャレンジは制限時間内に解き続ける形式で、出しても読む間も
   * なく次の問題へ変わるため出さない
   */
  readonly showAnswer: boolean;
  readonly handleToggleYaku: (yakuName: string) => void;
  readonly handleSubmit: () => void;
}

/**
 * 役判定の練習の出題状態と回答ロジック
 * 役判定ボード
 *
 * 出題・役の複数選択・一括の採点・結果の記録・次問への差し替えを持ち、
 * 盤面は描画だけをする。チャレンジ・トレーニングの両モードと、
 * web・モバイルの両方で共有する。
 */
export function useYakuBoard({
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: Pick<
  RecordingPracticeBoardProps<YakuQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
>): UseYakuBoardResult {
  const [question, setQuestion] = useGeneratedQuestion(generateQuestion);
  const [selectedYaku, setSelectedYaku] =
    useState<ReadonlySet<string>>(EMPTY_SELECTION);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(EMPTY_SELECTION);
    setQuestionIndex((index) => index + 1);
  }, [setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const gradeAndRecord = useGradeAndRecord(toResult, {
    onRecordResult,
    onAnswer,
    advance: advanceQuestion,
  });

  const { isRevealed, isHolding } = useTrainingMode();
  const showAnswer = isRevealed || isHolding;

  const handleToggleYaku = useCallback(
    (yakuName: string) => {
      if (showFeedback) return;
      setSelectedYaku((prev) => {
        const next = new Set(prev);
        if (next.has(yakuName)) {
          next.delete(yakuName);
        } else {
          next.add(yakuName);
        }
        return next;
      });
    },
    [showFeedback],
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback || selectedYaku.size === 0) return;
    gradeAndRecord(question, [...selectedYaku]);
  }, [question, selectedYaku, showFeedback, gradeAndRecord]);

  return {
    question,
    selectedYaku,
    questionIndex,
    showAnswer,
    handleToggleYaku,
    handleSubmit,
  };
}
