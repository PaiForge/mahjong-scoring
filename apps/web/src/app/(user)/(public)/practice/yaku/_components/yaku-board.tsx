"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  SELECTABLE_YAKU_GROUPS,
  YAKUMAN_HAN,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion);
}

type YakuBoardProps = PracticeBoardProps;

/** 翻数グループの i18n キー（役満だけ数値ではなく "yakuman"） */
function hanGroupKey(han: number): string {
  return han === YAKUMAN_HAN ? "yakuman" : String(han);
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
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
  }, [setQuestion]);

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
    const isCorrect = judgeYakuAnswer(question.correctYakuNames, [
      ...selectedYaku,
    ]);
    onAnswer(isCorrect, advanceQuestion);
  }, [question, selectedYaku, showFeedback, onAnswer, advanceQuestion]);

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  const hasSelection = selectedYaku.size > 0;

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        translationNamespace="yaku"
      />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* Yaku selection */}
      <div className="space-y-3">
        {SELECTABLE_YAKU_GROUPS.map((group) => (
          <div key={group.han} className="space-y-1.5">
            <p className="text-xs font-semibold text-surface-400">
              {t(`hanGroup.${hanGroupKey(group.han)}`)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.names.map((yakuName) => (
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
              ))}
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
    </div>
  );
}
