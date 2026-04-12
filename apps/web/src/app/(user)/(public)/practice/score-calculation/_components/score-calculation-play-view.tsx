"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion, HaiKind, judgeScoreTableAnswer } from "@mahjong-scoring/core";
import type { ScoreQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { ChallengeShell } from "../../_components/challenge-shell";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreCalculationAnswerForm } from "./score-calculation-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, paymentToScoreTableAnswer } from "../_lib/types";

/**
 * 点数計算練習本体
 * 点数計算練習
 */
export function ScoreCalculationPlayView() {
  const t = useTranslations("scoreCalculationChallenge");
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(() =>
    generateValidScoreQuestion() ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, lastAnswerCorrect, handleAnswer } = gameSession;

  const questionResultsRef = useRef<ScoreCalculationQuestionResult[]>([]);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion() ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, []);

  const handleFinish = useSaveOnFinish("score_calculation");

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback || !question) return;

      const correctAnswer = paymentToScoreTableAnswer(question.answer.payment);
      const isCorrect = judgeScoreTableAnswer(userAnswer, correctAnswer);

      const isOya = question.jikaze === HaiKind.Ton;

      questionResultsRef.current.push({
        isOya,
        isTsumo: question.isTsumo,
        han: question.answer.han,
        fu: question.answer.fu,
        correctAnswer,
        userAnswer,
        isCorrect,
      });

      handleAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, handleAnswer, advanceQuestion],
  );

  useSessionStorageSave(RESULT_STORAGE_KEY, questionResultsRef, gameSession.isFinished);

  const feedbackBorderClass = getFeedbackBorderClass(showFeedback, lastAnswerCorrect);

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-surface-500">{t("generating")}</div>
      </div>
    );
  }

  return (
    <ChallengeShell
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/score-calculation/result"
      onFinish={handleFinish}
      maxWidth="max-w-lg"
    >
      {/* Question display */}
      <div className={`mt-6 rounded-xl border-2 p-2 transition-colors sm:p-4 ${feedbackBorderClass}`}>
        <QuestionDisplay question={question} />
      </div>

      {/* Answer form */}
      <div className="mt-6">
        <ScoreCalculationAnswerForm
          question={question}
          questionIndex={questionIndex}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
        />
      </div>
    </ChallengeShell>
  );
}
