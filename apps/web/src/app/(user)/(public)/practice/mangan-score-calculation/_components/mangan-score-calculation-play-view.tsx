"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useRecordedResults } from "../../_hooks/use-recorded-results";
import { ChallengeShell } from "../../_components/challenge-shell";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, parsePlayerType } from "../_lib/types";

/**
 * 満貫以上点数計算ドリル本体
 * 満貫以上点数計算ドリル
 */
export function ManganScoreCalculationPlayView() {
  const t = useTranslations("manganScoreCalculationChallenge");
  const searchParams = useSearchParams();
  const playerType = parsePlayerType(searchParams.get("player") ?? undefined);

  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("mangan_score_calculation");

  const { recordResult } =
    useRecordedResults<ManganScoreCalculationQuestionResult>(
      RESULT_STORAGE_KEY,
      gameSession.isFinished,
    );

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/mangan-score-calculation/result"
      exitHref="/practice/mangan-score-calculation"
      onFinish={handleFinish}
      maxWidth="max-w-lg"
    >
      <ManganScoreCalculationBoard
        playerType={playerType}
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        lastAnswerCorrect={gameSession.lastAnswerCorrect}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
