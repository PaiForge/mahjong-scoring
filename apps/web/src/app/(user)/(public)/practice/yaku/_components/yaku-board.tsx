"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  SELECTABLE_YAKU,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";
import { HAN_GROUPS } from "../_lib/han-groups";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion);
}

interface YakuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: YakuBoardProps) {
  const t = useTranslations("yaku");
  const [question, setQuestion] = useState<YakuQuestion | undefined>(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
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
    onAnswer(isCorrect, advanceQuestion);
  }, [question, selectedYaku, showFeedback, onAnswer, advanceQuestion]);

  if (!question) return undefined;

  const hasSelection = selectedYaku.size > 0;

  return (
    <>
      <TehaiDisplay
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
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {t("checkButton")}
      </ChallengeSubmitButton>
    </>
  );
}
