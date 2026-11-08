"use client";

import { useTranslations } from "next-intl";

import { ChoiceButton } from "./choice-button";
import { getChoiceFeedbackProps } from "../_lib/feedback-styles";
import { FU_CHOICE_LABEL_CLASSES } from "../_lib/fu-choice-classes";

interface FuChoiceGridProps {
  /** 表示する符の選択肢 */
  readonly options: readonly number[];
  /** 正解の符 */
  readonly answer: number;
  /** 直前に選択された符 */
  readonly selectedFu: number | undefined;
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly onSelect: (index: number) => void;
  /** グリッドの列数クラス（例: "grid-cols-2"） */
  readonly columnsClassName: string;
  /** `fuOption` キーを持つ翻訳名前空間（例: "machiFu"） */
  readonly translationNamespace: string;
}

/**
 * 出題盤面の符選択肢グリッド
 * 符選択肢
 *
 * 符を選ぶ練習（待ち符・面子符）の回答ボタン列。正誤フィードバックの配色は
 * getChoiceFeedbackProps に委譲する。
 */
export function FuChoiceGrid({
  options,
  answer,
  selectedFu,
  showFeedback,
  isCountingDown,
  onSelect,
  columnsClassName,
  translationNamespace,
}: FuChoiceGridProps) {
  const t = useTranslations(translationNamespace);

  return (
    <div className={`grid ${columnsClassName} gap-3`}>
      {options.map((fu, i) => (
        <ChoiceButton
          key={fu}
          index={i}
          onSelect={onSelect}
          className={`font-bold ${FU_CHOICE_LABEL_CLASSES}`}
          {...getChoiceFeedbackProps({
            showFeedback,
            isCountingDown,
            isSelected: selectedFu === fu,
            isCorrect: answer === fu,
          })}
        >
          {t("fuOption", { value: fu })}
        </ChoiceButton>
      ))}
    </div>
  );
}
