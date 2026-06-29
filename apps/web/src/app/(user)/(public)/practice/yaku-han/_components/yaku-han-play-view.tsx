"use client";

import { useTranslations } from "next-intl";
import { normalizeYakuHanRange } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { useRecordedResults } from "../../_hooks/use-recorded-results";
import { ChallengeShell } from "../../_components/challenge-shell";
import { YakuHanBoard } from "./yaku-han-board";
import type { YakuHanQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

interface YakuHanPlayViewProps {
  /** 出題範囲（URL の range クエリ。不正値・未指定は全役にフォールバック） */
  readonly range?: string;
}

/**
 * 役翻数練習本体
 * 役翻数練習
 */
export function YakuHanPlayView({ range }: YakuHanPlayViewProps) {
  const t = useTranslations("yakuHanChallenge");
  const { gameSession, timerControl } = useTimedSession();
  const handleFinish = useSaveOnFinish("yaku_han");
  const yakuHanRange = normalizeYakuHanRange(range);

  const { recordResult } = useRecordedResults<YakuHanQuestionResult>(
    RESULT_STORAGE_KEY,
    gameSession.isFinished,
  );

  return (
    <ChallengeShell
      title={t("title")}
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/yaku-han/result"
      exitHref="/practice/yaku-han"
      onFinish={handleFinish}
      maxWidth="max-w-2xl"
    >
      <YakuHanBoard
        showFeedback={gameSession.showFeedback}
        isCountingDown={gameSession.isCountingDown}
        range={yakuHanRange}
        onAnswer={gameSession.handleAnswer}
        onRecordResult={recordResult}
      />
    </ChallengeShell>
  );
}
