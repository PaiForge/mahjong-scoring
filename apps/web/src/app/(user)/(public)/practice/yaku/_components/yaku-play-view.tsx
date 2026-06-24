"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChallengeShell } from "../../_components/challenge-shell";
import { YakuBoard } from "./yaku-board";

export function YakuPlayView() {
  const t = useTranslations("yaku");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("yaku");

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/yaku/result"
      exitHref="/practice/yaku"
      maxWidth="max-w-2xl"
      onFinish={handleFinish}
    >
      <YakuBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        onAnswer={gameSession.handleAnswer}
      />
    </ChallengeShell>
  );
}
