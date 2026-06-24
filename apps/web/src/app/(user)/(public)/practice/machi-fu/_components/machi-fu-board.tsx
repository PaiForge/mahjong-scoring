"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { ChoiceButton } from "../../_components/choice-button";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

const FU_OPTIONS = [0, 2] as const;

interface MachiFuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 待ち符の出題盤面（待ち牌・和了牌の提示と2択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MachiFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: MachiFuBoardProps) {
  const t = useTranslations("machiFu");
  const [question, setQuestion] = useState<MachiFuQuestion>(
    generateMachiFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMachiFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFuSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const fu = FU_OPTIONS[index];
      setSelectedFu(fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, onAnswer, question.answer, advanceQuestion]
  );

  return (
    <div className="mt-6 space-y-5">
      {/* Machi tiles */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("machiLabel")}
          </span>
          <div className="flex gap-0.5 scale-125 origin-center">
            {question.tiles.map((tile, i) => (
              <Hai key={i} hai={tile} />
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-surface-100" />

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("agariLabel")}
          </span>
          <div className="scale-125 origin-center">
            <Hai hai={question.agariHai} />
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <div className="grid grid-cols-2 gap-3">
        {FU_OPTIONS.map((fu, i) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            showFeedback,
            selectedFu === fu,
            question.answer === fu,
          );

          return (
            <ChoiceButton
              key={fu}
              index={i}
              onSelect={handleFuSelect}
              disabled={showFeedback || isCountingDown}
              borderClass={borderClass}
              bgClass={bgClass}
              className="text-2xl font-bold"
            >
              {t("fuOption", { value: fu })}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
