"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuestionScopedSelection } from "@mahjong-scoring/features/practice/use-question-scoped-selection";

import { ChoiceButton } from "./choice-button";
import { getFeedbackStyles } from "../_lib/feedback-styles";
import { QuestionPrompt } from "./question-prompt";
import type { HanChoiceAnswerFormBaseProps } from "@mahjong-scoring/features/practice/han-choice-answer-form-props";

interface HanChoiceAnswerFormProps extends HanChoiceAnswerFormBaseProps {
  /** グリッドの列数クラス（例: "grid-cols-4 sm:grid-cols-7"） */
  readonly columnsClassName: string;
}

/**
 * 翻数を選択肢ボタンで答える回答フォーム
 * 翻数選択回答フォーム
 *
 * 選択肢をタップした瞬間に回答が確定する。翻数即答練習・役翻数練習で共有し、
 * 選択肢の内容・列数・ラベル表記だけを各練習が指定する。
 */
export const HanChoiceAnswerForm = memo(function HanChoiceAnswerFormComponent({
  options,
  correctHan,
  questionIndex,
  showFeedback,
  onSubmit,
  disabled = false,
  translationNamespace,
  columnsClassName,
  renderLabel,
}: HanChoiceAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  const [selectedIndex, setSelectedIndex] =
    useQuestionScopedSelection<number>(questionIndex);

  const handleSelect = useCallback(
    (index: number) => {
      if (disabled) return;
      setSelectedIndex(index);
      onSubmit(options[index]);
    },
    [disabled, onSubmit, options, setSelectedIndex],
  );

  return (
    <div className="space-y-3">
      <QuestionPrompt>{t("selectHan")}</QuestionPrompt>
      <div className={`grid ${columnsClassName} gap-2`}>
        {options.map((han, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = han === correctHan;
          const { borderClass, bgClass } = getFeedbackStyles(
            showFeedback,
            isSelected,
            isCorrect,
          );

          return (
            <ChoiceButton
              key={han}
              index={index}
              onSelect={handleSelect}
              disabled={disabled}
              borderClass={borderClass}
              bgClass={bgClass}
              className="text-sm font-semibold"
            >
              {renderLabel(han, t)}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
});
