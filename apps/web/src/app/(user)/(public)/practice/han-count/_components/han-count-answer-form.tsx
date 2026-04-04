"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChoiceButton } from "../../_components/choice-button";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

/** 選択肢として表示する翻数の範囲（1翻〜13翻） */
const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

interface HanCountAnswerFormProps {
  /** 正解の翻数 */
  readonly correctHan: number;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  readonly onSubmit: (han: number) => void;
  readonly disabled?: boolean;
}

/**
 * 翻数即答ドリルの回答フォーム
 * 翻数回答フォーム
 *
 * 1翻〜13翻の選択肢をボタンで表示し、タップで即回答する。
 */
export const HanCountAnswerForm = memo(function HanCountAnswerForm({
  correctHan,
  questionIndex,
  showFeedback,
  onSubmit,
  disabled = false,
}: HanCountAnswerFormProps) {
  const t = useTranslations("hanCountDrill");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);

  // 問題が変わったら選択をリセットする
  useEffect(() => {
    setSelectedIndex(undefined);
  }, [questionIndex]);

  const handleSelect = useCallback(
    (index: number) => {
      if (disabled) return;
      setSelectedIndex(index);
      onSubmit(HAN_OPTIONS[index]);
    },
    [disabled, onSubmit],
  );

  return (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-surface-600">
        {t("selectHan")}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {HAN_OPTIONS.map((han, index) => {
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
              {t("hanOption", { count: han })}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
});
