"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";
import { YakuPicker } from "./yaku-picker";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { useTrainingReveal } from "../../_hooks/use-training-reveal";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion);
}

type YakuBoardProps = PracticeBoardProps;

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
}: YakuBoardProps) {
  const t = useTranslations("yaku");
  const yakuOrder = useYakuOrder();
  const labelOf = useYakuLabel();
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
  }, [setQuestion]);

  useTrainingReveal(question === undefined ? undefined : advanceQuestion);

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
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 回答中はリストから選ぶ。答え合わせでは全役を並べて正誤を示す
          （選び忘れた正解役は、選択済みの欄だけでは見えないため） */}
      {showFeedback ? (
        <div className="flex flex-wrap gap-1.5">
          {yakuOrder.map((yakuName) => (
            <YakuChip
              key={yakuName}
              yakuName={yakuName}
              label={labelOf(yakuName)}
              isSelected={selectedYaku.has(yakuName)}
              feedbackState={getChipFeedbackState(
                yakuName,
                selectedYaku,
                question.correctYakuNames,
              )}
              disabled
              onToggle={handleToggleYaku}
            />
          ))}
        </div>
      ) : (
        <YakuPicker
          selected={selectedYaku}
          disabled={isCountingDown}
          onToggle={handleToggleYaku}
        />
      )}

      {/* Submit button（チャレンジは押した瞬間に次問題へ進むため「回答する」） */}
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>
    </div>
  );
}
