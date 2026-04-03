"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  SELECTABLE_YAKU,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import type { FinishCallbackArgs } from "../../_hooks/use-finish-redirect";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { DrillShell } from "../../_components/drill-shell";
import { DrillTehaiDisplay } from "../../_components/drill-tehai-display";
import { retryGenerate } from "../../_lib/retry-generate";
import { saveYakuResult } from "../_actions/save-result";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";
import { HAN_GROUPS } from "../_lib/han-groups";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion);
}

export function YakuDrill() {
  const t = useTranslations("yaku");
  const [question, setQuestion] = useState<YakuQuestion | undefined>(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
  }, []);

  const handleFinish = useCallback(async (args: FinishCallbackArgs) => {
    if (args.totalCount === 0) return;
    const result = await saveYakuResult({
      correctAnswers: args.correctCount,
      incorrectAnswers: args.incorrectCount,
      timeTaken: Math.round(args.elapsedMs / 1000),
    });
    if (!result.success) {
      console.error("Failed to save yaku result:", result.error);
    }
  }, []);

  const handleToggleYaku = useCallback(
    (yakuName: string) => {
      if (showFeedback) return;
      setSelectedYaku((prev) => {
        const next = new Set(prev);
        if (next.has(yakuName)) {
          next.delete(yakuName);
        } else {
          next.add(yakuName);
        }
        return next;
      });
    },
    [showFeedback],
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback || selectedYaku.size === 0) return;
    const isCorrect = judgeYakuAnswer(
      question.correctYakuNames,
      [...selectedYaku],
    );
    handleAnswer(isCorrect, advanceQuestion);
  }, [question, selectedYaku, showFeedback, handleAnswer, advanceQuestion]);

  if (!question) return undefined;

  const hasSelection = selectedYaku.size > 0;

  return (
    <DrillShell
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/yaku/result"
      maxWidth="max-w-2xl"
      onFinish={handleFinish}
    >
      <DrillTehaiDisplay
        tehai={question.tehai}
        context={question.context}
        translationNamespace="yaku"
      />

      {/* Instruction */}
      <p className="mt-4 text-center text-sm font-medium text-surface-600">
        {t("selectYaku")}
      </p>

      {/* Yaku selection */}
      <div className="mt-3 space-y-3">
        {HAN_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-xs font-semibold text-surface-400">
              {t(`hanGroup.${group.key}`)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_YAKU.slice(group.startIndex, group.endIndex).map(
                (yakuName) => (
                  <YakuChip
                    key={yakuName}
                    yakuName={yakuName}
                    isSelected={selectedYaku.has(yakuName)}
                    feedbackState={
                      showFeedback
                        ? getChipFeedbackState(
                            yakuName,
                            selectedYaku,
                            question.correctYakuNames,
                          )
                        : undefined
                    }
                    disabled={showFeedback || isCountingDown}
                    onToggle={handleToggleYaku}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasSelection || showFeedback || isCountingDown}
          className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            hasSelection && !showFeedback && !isCountingDown
              ? "bg-primary-500 hover:bg-primary-600"
              : "cursor-not-allowed bg-surface-300"
          }`}
        >
          {t("checkButton")}
        </button>
      </div>
    </DrillShell>
  );
}
