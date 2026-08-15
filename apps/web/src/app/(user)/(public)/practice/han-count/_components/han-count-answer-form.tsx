"use client";

import { HanChoiceAnswerForm } from "../../_components/han-choice-answer-form";

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
 * 翻数即答練習の回答フォーム
 * 翻数回答フォーム
 *
 * 1翻〜13翻の選択肢をボタンで表示し、タップで即回答する。
 */
export function HanCountAnswerForm(props: HanCountAnswerFormProps) {
  return (
    <HanChoiceAnswerForm
      {...props}
      options={HAN_OPTIONS}
      translationNamespace="hanCountChallenge"
      columnsClassName="grid-cols-4 sm:grid-cols-5"
      renderLabel={(han, t) => t("hanOption", { count: han })}
    />
  );
}
