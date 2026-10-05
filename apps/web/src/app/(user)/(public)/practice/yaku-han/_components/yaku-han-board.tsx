"use client";

import { useGradeAndRecord } from "@mahjong-scoring/features/practice/use-grade-answer";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_YAKU_HAN_RANGE,
  generateYakuHanQuestion,
} from "@mahjong-scoring/core";
import type { YakuHanQuestion, YakuHanRange } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useGeneratedQuestion } from "@mahjong-scoring/features/practice/use-generated-question";
import { usePresentQuestion } from "@mahjong-scoring/features/practice/use-present-question";
import { useRegisterAdvance } from "@mahjong-scoring/features/practice/use-training-mode";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import { toQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";
import type { YakuHanQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

interface YakuHanBoardProps extends RecordingPracticeBoardProps<YakuHanQuestionResult> {
  /** 出題範囲（役のフィルタ）。未指定時は全役から出題する */
  readonly range?: YakuHanRange;
}

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: YakuHanQuestion): YakuHanQuestionResult {
  return toQuestionResult(question, undefined);
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
  onPresentQuestion,
}: YakuHanBoardProps) {
  const t = useTranslations("yakuHanChallenge");
  const generateQuestion = useCallback(
    (): YakuHanQuestion => generateYakuHanQuestion(range),
    [range],
  );
  const [question, setQuestion] = useGeneratedQuestion(generateQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setQuestionIndex((prev) => prev + 1);
  }, [generateQuestion, setQuestion]);

  const gradeAndRecord = useGradeAndRecord(toQuestionResult, {
    onRecordResult,
    onAnswer,
    advance: advanceQuestion,
  });

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      gradeAndRecord(question, userHan);
    },
    [showFeedback, question, gradeAndRecord],
  );

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="yakuHan"
      />
    );
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
