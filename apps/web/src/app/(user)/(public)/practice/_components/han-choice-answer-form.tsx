"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ChoiceButton } from "./choice-button";
import { getFeedbackStyles } from "../_lib/feedback-styles";

interface HanChoiceAnswerFormProps {
  /** 表示する翻数の選択肢 */
  readonly options: readonly number[];
  /** 正解の翻数 */
  readonly correctHan: number;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  readonly onSubmit: (han: number) => void;
  readonly disabled?: boolean;
  /** `selectHan` キーを持つ翻訳名前空間（例: "yakuHanChallenge"） */
  readonly translationNamespace: string;
  /** グリッドの列数クラス（例: "grid-cols-4 sm:grid-cols-7"） */
  readonly columnsClassName: string;
  /**
   * 選択肢の表示ラベル。翻訳関数を受け取り、役満などの特別表記を各練習が決める。
   */
  readonly renderLabel: (
    han: number,
    t: (key: string, values?: Record<string, number>) => string,
  ) => string;
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
      onSubmit(options[index]);
    },
    [disabled, onSubmit, options],
  );

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectHan")}
      </p>
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
