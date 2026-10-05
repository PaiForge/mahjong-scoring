"use client";

import { useTranslations } from "next-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChoiceButton } from "../../_components/choice-button";
import { JantouFuKazeContext } from "./jantou-fu-kaze-context";
import { getChoiceFeedbackProps } from "../../_lib/feedback-styles";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useJantouFuBoard } from "@mahjong-scoring/features/practice/jantou-fu/use-jantou-fu-board";
import type { JantouFuQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

type JantouFuBoardProps = RecordingPracticeBoardProps<JantouFuQuestionResult>;

/**
 * 雀頭符の出題盤面（場風・自風の提示と4択）
 *
 * 出題状態と回答ロジックは `useJantouFuBoard` が持ち、チャレンジ・トレーニング両モードで共有する。
 * セッション管理（タイマー・スコア集計・終了判定）は親の shell が担う。
 */
export function JantouFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: JantouFuBoardProps) {
  const t = useTranslations("jantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const { question, selectedHai, handleSelect } = useJantouFuBoard({
    renfonpaiAs4Fu,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="jantouFu"
      />
    );
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
            onSelect={handleSelect}
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
