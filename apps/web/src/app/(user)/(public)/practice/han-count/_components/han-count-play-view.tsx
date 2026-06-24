"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useSessionStorageSave } from "../../_hooks/use-session-storage-save";
import { ChallengeShell } from "../../_components/challenge-shell";
import { HanCountBoard } from "./han-count-board";
import type { HanCountQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 翻数即答練習本体
 * 翻数即答練習
 */
export function HanCountPlayView() {
  const t = useTranslations("hanCountChallenge");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("han_count");

  const questionResultsRef = useRef<HanCountQuestionResult[]>([]);
  const recordResult = useCallback((result: HanCountQuestionResult) => {
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
      resultPath="/practice/han-count/result"
      exitHref="/practice/han-count"
      onFinish={handleFinish}
      maxWidth="max-w-2xl"
    >
      <HanCountBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
