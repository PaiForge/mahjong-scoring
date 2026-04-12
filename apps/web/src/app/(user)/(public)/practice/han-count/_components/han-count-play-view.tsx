"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { ChallengeShell } from "../../_components/challenge-shell";
import { TehaiDisplay } from "../../_components/tehai-display";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 翻数即答練習本体
 * 翻数即答練習
 */
export function HanCountPlayView() {
  const t = useTranslations("hanCountChallenge");
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(() =>
    generateValidScoreQuestion() ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const questionResultsRef = useRef<HanCountQuestionResult[]>([]);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion() ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, []);

  const handleFinish = useSaveOnFinish("han_count");

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      const correctHan = question.answer.han;
      const isCorrect = userHan === correctHan;

      questionResultsRef.current.push({
        correctHan,
        userHan,
        isCorrect,
      });

      handleAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, handleAnswer, advanceQuestion],
  );

  useSessionStorageSave(RESULT_STORAGE_KEY, questionResultsRef, gameSession.isFinished);

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
      resultPath="/practice/han-count/result"
      onFinish={handleFinish}
      maxWidth="max-w-2xl"
    >
      <TehaiDisplay
        tehai={question.tehai}
        context={{
          bakaze: question.bakaze,
          jikaze: question.jikaze,
          agariHai: question.agariHai,
          isTsumo: question.isTsumo,
          isRiichi: question.isRiichi,
          doraMarkers: question.doraMarkers,
        }}
        translationNamespace="hanCountChallenge"
      />

      {/* Answer form */}
      <div className="mt-4">
        <HanCountAnswerForm
          correctHan={question.answer.han}
          questionIndex={questionIndex}
          showFeedback={showFeedback}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
        />
      </div>
    </ChallengeShell>
  );
}
