"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChallengeShell } from "../../_components/challenge-shell";
import { JantouFuBoard } from "./jantou-fu-board";

export function JantouFuPlayView() {
  const t = useTranslations("jantouFu");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("jantou_fu");

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/jantou-fu/result"
      onFinish={handleFinish}
    >
      <JantouFuBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
      />
    </ChallengeShell>
  );
}
