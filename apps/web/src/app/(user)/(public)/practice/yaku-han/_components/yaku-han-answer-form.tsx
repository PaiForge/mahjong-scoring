"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { ChoiceButton } from "../../_components/choice-button";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

/** 選択肢として表示する翻数（1〜6翻 + 役満） */
export const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, YAKUMAN_HAN] as const;

/** 翻数を表示ラベルに変換するためのヘルパー（役満は専用表記） */
export function isYakuman(han: number): boolean {
  return han === YAKUMAN_HAN;
}

interface YakuHanAnswerFormProps {
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
 * 役翻数練習の回答フォーム
 * 役翻数回答フォーム
 *
 * 1翻〜6翻と役満の選択肢をボタンで表示し、タップで即回答する。
 */
export const YakuHanAnswerForm = memo(function YakuHanAnswerForm({
  correctHan,
  questionIndex,
  showFeedback,
  onSubmit,
  disabled = false,
}: YakuHanAnswerFormProps) {
  const t = useTranslations("yakuHanChallenge");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(
    undefined,
  );

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
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectHan")}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
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
              {isYakuman(han) ? t("yakuman") : t("hanOption", { count: han })}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
});
