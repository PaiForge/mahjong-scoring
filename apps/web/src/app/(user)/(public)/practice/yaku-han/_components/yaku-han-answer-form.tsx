"use client";

import { YAKUMAN_HAN } from "@mahjong-scoring/core";

import { HanChoiceAnswerForm } from "../../_components/han-choice-answer-form";

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
export function YakuHanAnswerForm(props: YakuHanAnswerFormProps) {
  return (
    <HanChoiceAnswerForm
      {...props}
      options={HAN_OPTIONS}
      translationNamespace="yakuHanChallenge"
      columnsClassName="grid-cols-4 sm:grid-cols-7"
      renderLabel={(han, t) =>
        isYakuman(han) ? t("yakuman") : t("hanOption", { count: han })
      }
    />
  );
}
