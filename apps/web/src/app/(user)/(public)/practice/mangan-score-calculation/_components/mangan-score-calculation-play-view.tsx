"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion, HaiKind, judgeScoreTableAnswer } from "@mahjong-scoring/core";
import type { ScoreQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { ChallengeShell } from "../../_components/challenge-shell";
import { QuestionDisplay } from "../../score/_components/question-display";
import { YakuListDisplay } from "./yaku-list-display";
import { ManganScoreCalculationAnswerForm } from "./mangan-score-calculation-answer-form";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, paymentToScoreTableAnswer, parsePlayerType, playerTypeToOptions } from "../_lib/types";

/**
 * 満貫以上点数計算ドリル本体
 * 満貫以上点数計算ドリル
 */
export function ManganScoreCalculationPlayView() {
  const t = useTranslations("manganScoreCalculationChallenge");
  const searchParams = useSearchParams();
  const playerType = parsePlayerType(searchParams.get("player") ?? undefined);
  const playerOptions = playerTypeToOptions(playerType);

  const generateOptions = {
    allowedRanges: ["mangan_plus" as const],
    ...playerOptions,
  };

  const [question, setQuestion] = useState<ScoreQuestion | undefined>(() =>
    generateValidScoreQuestion(generateOptions) ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, lastAnswerCorrect, handleAnswer } = gameSession;

  const questionResultsRef = useRef<ManganScoreCalculationQuestionResult[]>([]);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion(generateOptions) ?? undefined);
    setQuestionIndex((prev) => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = useSaveOnFinish("mangan_score_calculation");

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
      resultPath="/practice/mangan-score-calculation/result"
      onFinish={handleFinish}
      maxWidth="max-w-lg"
    >
      {/* Question display */}
      <div className={`mt-6 rounded-xl border-2 p-2 transition-colors sm:p-4 ${feedbackBorderClass}`}>
        <QuestionDisplay question={question} />
      </div>

      {/* Yaku list */}
      {question.yakuDetails && question.yakuDetails.length > 0 && (
        <div className="mt-4">
          <YakuListDisplay yakuDetails={question.yakuDetails} />
        </div>
      )}

      {/* Answer form */}
      <div className="mt-6">
        <ManganScoreCalculationAnswerForm
          question={question}
          questionIndex={questionIndex}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
        />
      </div>
    </ChallengeShell>
  );
}
