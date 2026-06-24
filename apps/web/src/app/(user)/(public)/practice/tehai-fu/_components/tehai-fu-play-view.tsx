"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChallengeShell } from "../../_components/challenge-shell";
import { TehaiFuBoard } from "./tehai-fu-board";

export function TehaiFuPlayView() {
  const t = useTranslations("tehaiFu");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("tehai_fu");

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/tehai-fu/result"
      exitHref="/practice/tehai-fu"
      maxWidth="max-w-lg"
      onFinish={handleFinish}
    >
      <TehaiFuBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
      />
    </ChallengeShell>
  );
}
