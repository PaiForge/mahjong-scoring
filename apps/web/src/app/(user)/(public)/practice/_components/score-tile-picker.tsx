"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ScoreRange } from "@mahjong-scoring/core";
import type { SingleInputScores } from "@mahjong-scoring/features/practice/score/get-available-scores";
import {
  resolveScoreTileBands,
  SCORE_BANDS,
} from "@mahjong-scoring/features/practice/score/score-tile-bands";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  SELECTED_TILE_CLASSES,
  UNSELECTED_TILE_CLASSES,
} from "@/app/(user)/_components/_lib/selection-classes";
import { getFeedbackStyles } from "../_lib/feedback-styles";
import type { SelectFeedbackState } from "../_lib/select-class";

interface ScoreTilePickerProps {
  /** 選択肢（子ツモは組の `koTsumoCombined` だけを受ける） */
  readonly available: SingleInputScores;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  /**
   * 選んだ選択肢の値（`ScoreSelectOption.value`。点数は `"1000"`、子ツモの組は
   * `"300/500"`）。未選択は undefined
   */
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  /** 各点数の後置文字列（親ツモの「オール」） */
  readonly suffix?: string;
  readonly disabled?: boolean;
  /** 見出しの要素の id（タイル群の名前にする） */
  readonly labelledBy: string;
  /**
   * 選んだ時点で送信されるか。送信されるなら選んだタイルを採点待ちの灰で、
   * 「回答する」ボタンで送るなら選択中の墨で示す
   */
  readonly autoSubmit?: boolean;
  /** 回答直後の正誤（正誤を返さない画面では省略する） */
  readonly feedback?: SelectFeedbackState;
}

/**
 * 点数をタイルで答える欄
 * 点数タイル入力
 *
 * select では選択肢が多すぎる（子ロンの全範囲で 30 個）ため、「満貫未満 /
 * 満貫以上」の切り替えで片側だけを並べる。どちらの帯を開くか・切り替えを
 * 出すか・隠れた側の選択・確保する行数は features の
 * {@link resolveScoreTileBands}（モバイルと共通）が決め、ここは描画だけを持つ。
 *
 * 両側のタイル群のうち多いほうの高さを確保し、切り替えで下の「回答する」
 * ボタンが上下に動かないようにする。
 */
export function ScoreTilePicker({
  available,
  isOya,
  isTsumo,
  value,
  onChange,
  suffix = "",
  disabled = false,
  labelledBy,
  autoSubmit = false,
  feedback,
}: ScoreTilePickerProps) {
  const t = useTranslations("practice.scoreInput");
  const [chosenBand, setChosenBand] = useState<ScoreRange | undefined>();

  const { options, hasBoth, band, hiddenSelection, columns, rows } =
    resolveScoreTileBands({
      available,
      isOya,
      isTsumo,
      value,
      chosenBand,
      suffix,
    });

  const showsFeedback =
    feedback !== undefined &&
    feedback.showFeedback &&
    feedback.lastAnswerCorrect !== undefined;

  const tileClasses = (isSelected: boolean): string => {
    if (showsFeedback) {
      const { borderClass, bgClass } = getFeedbackStyles(
        true,
        isSelected,
        isSelected && feedback?.lastAnswerCorrect === true,
      );
      return `${borderClass} ${bgClass}`;
    }
    if (!isSelected) return UNSELECTED_TILE_CLASSES;
    return autoSubmit
      ? "border-pending-border bg-pending"
      : SELECTED_TILE_CLASSES;
  };

  return (
    <div role="group" aria-labelledby={labelledBy} className="space-y-3">
      {hasBoth && (
        <div
          role="group"
          aria-label={t("bands")}
          className="grid grid-cols-2 overflow-hidden rounded-lg border border-surface-400"
        >
          {SCORE_BANDS.map((b, index) => {
            const isActive = b === band;
            return (
              <button
                key={b}
                type="button"
                aria-pressed={isActive}
                disabled={disabled}
                onClick={() => setChosenBand(b)}
                className={`min-h-11 px-2 text-sm font-bold transition-colors ${FOCUS_RING_CLASSES} focus-visible:ring-offset-0 focus-visible:ring-inset ${
                  index > 0 ? "border-l border-surface-400" : ""
                } ${
                  isActive
                    ? "bg-selected text-selected-foreground"
                    : "bg-white text-surface-700 hover:bg-surface-50 disabled:hover:bg-white"
                }`}
              >
                {t(b)}
                {hiddenSelection?.band === b
                  ? ` · ${hiddenSelection.label}`
                  : ""}
              </button>
            );
          })}
        </div>
      )}
      <div
        className={`grid gap-1.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-4"} content-start`}
        // 多いほうの帯の行数ぶん（1 行 = タイル 2.75rem + 行間 0.375rem）
        style={{
          minHeight: `calc(${rows} * 2.75rem + ${rows - 1} * 0.375rem)`,
        }}
      >
        {options[band].map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-lg border px-1 text-sm font-bold tabular-nums text-surface-900 transition-colors disabled:cursor-not-allowed ${FOCUS_RING_CLASSES} ${tileClasses(isSelected)}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
