"use client";

import { useCallback, useState } from "react";
import {
  DEFAULT_YAKU_HAN_RANGE,
  generateYakuHanQuestion,
} from "@mahjong-scoring/core";
import type { YakuHanQuestion, YakuHanRange } from "@mahjong-scoring/core";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import type { YakuHanQuestionResult } from "../_lib/types";

interface YakuHanBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 出題範囲（役のフィルタ）。未指定時は全役から出題する */
  readonly range?: YakuHanRange;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: YakuHanQuestionResult) => void;
}

/**
 * 役翻数の出題盤面（役名・状態の提示と翻数入力）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function YakuHanBoard({
  showFeedback,
  isCountingDown = false,
  range = DEFAULT_YAKU_HAN_RANGE,
  onAnswer,
  onRecordResult,
}: YakuHanBoardProps) {
  const [question, setQuestion] = useState<YakuHanQuestion>(() =>
    generateYakuHanQuestion(range),
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateYakuHanQuestion(range));
    setQuestionIndex((prev) => prev + 1);
  }, [range]);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback) return;

      const correctHan = question.correctHan;
      const isCorrect = userHan === correctHan;

      onRecordResult?.({
        yakuName: question.yakuName,
        isMenzen: question.isMenzen,
        canNaki: question.canNaki,
        correctHan,
        userHan,
        isCorrect,
      });
      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  return (
    <div className="space-y-6">
      <YakuHanPrompt
        yakuName={question.yakuName}
        isMenzen={question.isMenzen}
        canNaki={question.canNaki}
      />

      <YakuHanAnswerForm
        correctHan={question.correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
