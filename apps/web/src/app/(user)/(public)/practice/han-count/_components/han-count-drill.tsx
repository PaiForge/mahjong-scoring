"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { generateValidQuestion } from "@mahjong-scoring/core";
import type { DrillQuestion } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { DrillShell } from "../../_components/drill-shell";
import { DrillTehaiDisplay } from "../../_components/drill-tehai-display";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 翻数即答ドリル本体
 * 翻数即答ドリル
 */
export function HanCountDrill() {
  const t = useTranslations("hanCountDrill");
  const [question, setQuestion] = useState<DrillQuestion | undefined>(() =>
    generateValidQuestion() ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const questionResultsRef = useRef<HanCountQuestionResult[]>([]);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidQuestion() ?? undefined);
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
    <DrillShell
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/han-count/result"
      onFinish={handleFinish}
      maxWidth="max-w-2xl"
    >
      <DrillTehaiDisplay
        tehai={question.tehai}
        context={{
          bakaze: question.bakaze,
          jikaze: question.jikaze,
          agariHai: question.agariHai,
          isTsumo: question.isTsumo,
          isRiichi: question.isRiichi,
          doraMarkers: question.doraMarkers,
        }}
        translationNamespace="hanCountDrill"
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
    </DrillShell>
  );
}
