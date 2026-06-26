"use client";

import { useTranslations } from "next-intl";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useRecordedResults } from "../../_hooks/use-recorded-results";
import { ChallengeShell } from "../../_components/challenge-shell";
import { ScoreTableBoard } from "./score-table-board";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 点数表早引き練習本体
 * 点数表練習
 */
export function ScoreTablePlayView() {
  const t = useTranslations("scoreTableChallenge");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("score_table");

  const { recordResult } = useRecordedResults<ScoreTableQuestionResult>(
    RESULT_STORAGE_KEY,
    gameSession.isFinished,
  );

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/score-table/result"
      exitHref="/practice/score-table"
      onFinish={handleFinish}
    >
      <ScoreTableBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        lastAnswerCorrect={gameSession.lastAnswerCorrect}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
