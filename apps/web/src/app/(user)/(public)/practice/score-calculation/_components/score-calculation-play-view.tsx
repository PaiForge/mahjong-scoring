"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { ChallengeShell } from "../../_components/challenge-shell";
import { ScoreCalculationBoard } from "./score-calculation-board";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 点数計算練習本体
 * 点数計算練習
 */
export function ScoreCalculationPlayView() {
  const t = useTranslations("scoreCalculationChallenge");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("score_calculation");

  const questionResultsRef = useRef<ScoreCalculationQuestionResult[]>([]);
  const recordResult = useCallback((result: ScoreCalculationQuestionResult) => {
    questionResultsRef.current.push(result);
  }, []);

  useSessionStorageSave(
    RESULT_STORAGE_KEY,
    questionResultsRef,
    gameSession.isFinished,
  );

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/score-calculation/result"
      exitHref="/practice/score-calculation"
      onFinish={handleFinish}
      maxWidth="max-w-lg"
    >
      <ScoreCalculationBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        lastAnswerCorrect={gameSession.lastAnswerCorrect}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
