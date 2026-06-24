"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChallengeShell } from "../../_components/challenge-shell";
import { MentsuFuBoard } from "./mentsu-fu-board";

export function MentsuFuPlayView() {
  const t = useTranslations("mentsuFu");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("mentsu_fu");

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/mentsu-fu/result"
      exitHref="/practice/mentsu-fu"
      onFinish={handleFinish}
    >
      <MentsuFuBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
      />
    </ChallengeShell>
  );
}
