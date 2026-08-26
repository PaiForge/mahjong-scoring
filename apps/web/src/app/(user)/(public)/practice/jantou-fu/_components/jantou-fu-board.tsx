"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateJantouFuQuestion } from "@mahjong-scoring/core";
import type { JantouFuQuestion, JantouFuChoice } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChoiceButton } from "../../_components/choice-button";
import { JantouFuKazeContext } from "./jantou-fu-kaze-context";
import { getChoiceFeedbackProps } from "../../_lib/feedback-styles";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { useTrainingReveal } from "../../_hooks/use-training-reveal";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

type JantouFuBoardProps = PracticeBoardProps;

/**
 * 雀頭符の出題盤面（場風・自風の提示と4択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * セッション管理（タイマー・スコア集計・終了判定）は親の shell が担う。
 */
export function JantouFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: JantouFuBoardProps) {
  const t = useTranslations("jantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    (): JantouFuQuestion => generateJantouFuQuestion({ renfonpaiAs4Fu }),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedHai, setSelectedHai] = useState<
    JantouFuChoice["hai"] | undefined
  >(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedHai(undefined);
  }, [generateQuestion, setQuestion]);

  useTrainingReveal(question === undefined ? undefined : advanceQuestion);

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const choice = question.choices[index];
      setSelectedHai(choice.hai);
      onAnswer(choice.isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion],
  );

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Context */}
      <JantouFuKazeContext
        bakaze={question.context.bakaze}
        jikaze={question.context.jikaze}
      />

      {/* Question */}
      <QuestionPrompt>{t("selectCorrectHead")}</QuestionPrompt>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, i) => (
          <ChoiceButton
            key={`${question.id}-${choice.hai}`}
            index={i}
            onSelect={handleChoiceSelect}
            className="flex-col gap-5"
            {...getChoiceFeedbackProps({
              showFeedback,
              isCountingDown,
              isSelected: selectedHai === choice.hai,
              isCorrect: choice.isCorrect,
            })}
          >
            <div className="scale-125">
              <Hai hai={choice.hai} />
            </div>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
