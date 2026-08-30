"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_YAKU_HAN_RANGE,
  generateYakuHanQuestion,
} from "@mahjong-scoring/core";
import type { YakuHanQuestion, YakuHanRange } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { useRegisterAdvance } from "../../_hooks/use-training-mode";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import type { YakuHanQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface YakuHanBoardProps extends RecordingPracticeBoardProps<YakuHanQuestionResult> {
  /** 出題範囲（役のフィルタ）。未指定時は全役から出題する */
  readonly range?: YakuHanRange;
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
  const t = useTranslations("yakuHanChallenge");
  const generateQuestion = useCallback(
    (): YakuHanQuestion => generateYakuHanQuestion(range),
    [range],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setQuestionIndex((prev) => prev + 1);
  }, [generateQuestion, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

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

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="mt-4 space-y-6">
      {/* 出題を囲む枠。盤面では役名が白いカードの上に浮いてしまうため、
          ここで面を与える（デモは「問題方式」セクションの枠が面になるため
          持たせない） */}
      <div className="rounded-xl border-3 border-ink bg-white py-8">
        <YakuHanPrompt
          yakuName={question.yakuName}
          isMenzen={question.isMenzen}
          canNaki={question.canNaki}
        />
      </div>

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
