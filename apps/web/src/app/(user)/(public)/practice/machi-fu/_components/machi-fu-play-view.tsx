"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChallengeShell } from "../../_components/challenge-shell";
import { MachiFuBoard } from "./machi-fu-board";

export function MachiFuPlayView() {
  const t = useTranslations("machiFu");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("machi_fu");

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/machi-fu/result"
      exitHref="/practice/machi-fu"
      onFinish={handleFinish}
    >
      <MachiFuBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
      />
    </ChallengeShell>
  );
}
