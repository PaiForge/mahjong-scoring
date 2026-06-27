"use client";

import { useTranslations } from "next-intl";
import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useRecordedResults } from "../../_hooks/use-recorded-results";
import { ChallengeShell } from "../../_components/challenge-shell";
import { ScoreTableBoard } from "./score-table-board";
import { useScoreTableQuestion } from "../_hooks/use-score-table-question";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

interface ScoreTablePlayViewProps {
  readonly generatorOptions?: ScoreTableGeneratorOptions;
}

/**
 * 点数表早引き練習本体
 * 点数表練習
 */
export function ScoreTablePlayView({
  generatorOptions,
}: ScoreTablePlayViewProps) {
  const t = useTranslations("scoreTableChallenge");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("score_table");
  const { question, advance } = useScoreTableQuestion(generatorOptions);

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
        question={question}
        onAdvance={advance}
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        lastAnswerCorrect={gameSession.lastAnswerCorrect}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
