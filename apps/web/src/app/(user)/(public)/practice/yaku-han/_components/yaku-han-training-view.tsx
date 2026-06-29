"use client";

import { useTranslations } from "next-intl";
import { normalizeYakuHanRange } from "@mahjong-scoring/core";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { YakuHanBoard } from "./yaku-han-board";

interface YakuHanTrainingViewProps {
  /** 出題範囲（URL の range クエリ。不正値・未指定は全役にフォールバック） */
  readonly range?: string;
}

export function YakuHanTrainingView({ range }: YakuHanTrainingViewProps) {
  const t = useTranslations("yakuHanChallenge");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();
  const yakuHanRange = normalizeYakuHanRange(range);

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/yaku-han"
      maxWidth="max-w-2xl"
    >
      <YakuHanBoard
        showFeedback={showFeedback}
        range={yakuHanRange}
        onAnswer={handleAnswer}
      />
    </TrainingShell>
  );
}
