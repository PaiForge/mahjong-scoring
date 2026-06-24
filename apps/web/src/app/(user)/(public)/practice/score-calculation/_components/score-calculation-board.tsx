"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateValidScoreQuestion,
  isOya,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreCalculationAnswerForm } from "./score-calculation-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { paymentToScoreTableAnswer } from "../_lib/types";

interface ScoreCalculationBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: ScoreCalculationQuestionResult) => void;
}

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function ScoreCalculationBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ScoreCalculationBoardProps) {
  const t = useTranslations("scoreCalculationChallenge");
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(
    () => generateValidScoreQuestion() ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion() ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, []);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback || !question) return;

      const correctAnswer = paymentToScoreTableAnswer(question.answer.payment);
      const isCorrect = judgeScoreTableAnswer(userAnswer, correctAnswer);

      onRecordResult?.({
        isOya: isOya(question.jikaze),
        isTsumo: question.isTsumo,
        han: question.answer.han,
        fu: question.answer.fu,
        correctAnswer,
        userAnswer,
        isCorrect,
      });

      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-surface-500">{t("generating")}</div>
      </div>
    );
  }

  const feedbackBorderClass = getFeedbackBorderClass(
    showFeedback,
    lastAnswerCorrect,
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <div
        className={`rounded-xl border-2 p-2 transition-colors sm:p-4 ${feedbackBorderClass}`}
      >
        <QuestionDisplay question={question} />
      </div>

      {/* Answer form */}
      <ScoreCalculationAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
