"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ScoreRange } from "@mahjong-scoring/core";
import {
  splitScoresByBand,
  type SingleInputScores,
} from "@mahjong-scoring/features/practice/score/get-available-scores";
import {
  koTsumoSelectOptions,
  scoreSelectOptions,
  type ScoreSelectOption,
} from "@mahjong-scoring/features/practice/score/score-select-options";
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

const BANDS = [
  "nonMangan",
  "manganPlus",
] as const satisfies readonly ScoreRange[];

/** 1 行に並べるタイルの数。子ツモの組（`1800/3600`）は幅が要るので 3 つ */
const COLUMNS = { single: 4, koTsumoCombined: 3 } as const;

/**
 * 点数をタイルで答える欄
 * 点数タイル入力
 *
 * select では選択肢が多すぎる（子ロンの全範囲で 30 個）ため、「満貫未満 /
 * 満貫以上」の切り替えで片側だけを並べる。選択肢が片側にしか無いとき
 * （5 翻以上・満貫の練習）は切り替えを出さない。
 *
 * 切り替えの初期値は問題によらず満貫未満 — 正解のある側を開くと、それ自体が
 * 答えのヒントになる。ただし選択済みの値（聴牌形の点数計算で回答済みのマス）が
 * あるときはその側を開く。切り替えても選択は消さず、隠れた側に選んだ値が
 * あるときは切り替えのボタンにその値を添える（見えない値で送れてしまうことを
 * 見せるため）。
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

  const split = splitScoresByBand(available, isOya, isTsumo);
  const options: Readonly<Record<ScoreRange, readonly ScoreSelectOption[]>> = {
    nonMangan: toOptions(split.nonMangan, suffix),
    manganPlus: toOptions(split.manganPlus, suffix),
  };
  const hasBoth = BANDS.every((band) => options[band].length > 0);
  const bandOfValue = BANDS.find((band) =>
    options[band].some((option) => option.value === value),
  );
  const band: ScoreRange = hasBoth
    ? (chosenBand ?? bandOfValue ?? "nonMangan")
    : options.nonMangan.length > 0
      ? "nonMangan"
      : "manganPlus";
  const selectedLabel = BANDS.flatMap((b) => options[b]).find(
    (option) => option.value === value,
  )?.label;

  const columns = COLUMNS[available.type];
  const rows = Math.ceil(
    Math.max(
      ...BANDS.map((b) => (hasBoth || b === band ? options[b].length : 0)),
    ) / columns,
  );

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
          {BANDS.map((b, index) => {
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
                {!isActive && b === bandOfValue && selectedLabel !== undefined
                  ? ` · ${selectedLabel}`
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

function toOptions(
  scores: SingleInputScores,
  suffix: string,
): readonly ScoreSelectOption[] {
  return scores.type === "koTsumoCombined"
    ? koTsumoSelectOptions(scores.payments)
    : scoreSelectOptions(scores.scores, suffix);
}
