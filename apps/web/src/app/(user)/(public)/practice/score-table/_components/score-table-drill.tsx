"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateScoreTableQuestion,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type { ScoreTableQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { DrillShell } from "../../_components/drill-shell";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 点数表早引きドリル本体
 * 点数表ドリル
 */
export function ScoreTableDrill() {
  const t = useTranslations("scoreTableDrill");
  const [question, setQuestion] = useState<ScoreTableQuestion>(
    generateScoreTableQuestion,
  );

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, lastAnswerCorrect, handleAnswer } = gameSession;

  const questionResultsRef = useRef<ScoreTableQuestionResult[]>([]);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateScoreTableQuestion());
  }, []);

  const handleFinish = useSaveOnFinish("score_table");

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback) return;
      const isCorrect = judgeScoreTableAnswer(userAnswer, question.correctAnswer);

      questionResultsRef.current.push({
        isOya: question.isOya,
        isTsumo: question.isTsumo,
        han: question.han,
        fu: question.fu,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
      });

      handleAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, handleAnswer, advanceQuestion],
  );

  useSessionStorageSave(RESULT_STORAGE_KEY, questionResultsRef, gameSession.isFinished);

  const feedbackBorderClass = getFeedbackBorderClass(showFeedback, lastAnswerCorrect);

  return (
    <DrillShell
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/score-table/result"
      onFinish={handleFinish}
    >
      {/* Question display */}
      <div className={`mt-6 rounded-xl border-2 p-6 transition-colors ${feedbackBorderClass}`}>
        <p className="text-center text-sm font-medium text-surface-500">
          {t("questionLabel")}
        </p>

        <div className="mt-4 flex justify-center gap-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-surface-900">
              {question.isOya ? t("oya") : t("ko")}
            </span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-surface-900">
              {question.isTsumo ? t("tsumo") : t("ron")}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-primary-600">
              {t("han", { count: question.han })}
            </span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-primary-600">
              {t("fu", { count: question.fu })}
            </span>
          </div>
        </div>
      </div>

      {/* Answer form */}
      <div className="mt-6">
        <ScoreTableAnswerForm
          question={question}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
        />
      </div>
    </DrillShell>
  );
}
