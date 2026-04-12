"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MentsuType } from "@mahjong-scoring/core";
import type { TehaiFuItem } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { FU_OPTIONS } from "../../_lib/fu-options";

interface FuItemRowProps {
  readonly index: number;
  readonly item: TehaiFuItem;
  readonly answer: string;
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly onSelect: (index: number, value: string) => void;
  readonly tileScale?: number;
}

/**
 * 符計算の個別要素行
 * 符要素行
 */
export const FuItemRow = memo(function FuItemRow({
  index,
  item,
  answer,
  showFeedback,
  isCountingDown,
  onSelect,
  tileScale,
}: FuItemRowProps) {
  const t = useTranslations("tehaiFu");
  const answerNum = answer ? parseInt(answer) : undefined;
  const isCorrect = showFeedback && answerNum === item.fu;
  const isWrong = showFeedback && answerNum !== item.fu;

  const handleButtonClick = useCallback(
    (value: number) => {
      onSelect(index, String(value));
    },
    [onSelect, index],
  );

  const scaleStyle = tileScale !== undefined && tileScale < 1
    ? { transform: `scale(${tileScale})`, transformOrigin: "left center" }
    : undefined;

  const renderItemTiles = () => {
    const tiles = item.originalMentsu && (item.isOpen || item.type === MentsuType.Kantsu)
      ? (
        <Furo
          mentsu={item.originalMentsu}
          furo={item.originalMentsu.furo}
          size="sm"
        />
      )
      : (
        <div className="flex gap-0.5">
          {item.tiles.map((tile, i) => (
            <Hai key={i} hai={tile} size="sm" />
          ))}
        </div>
      );

    if (!scaleStyle) return tiles;

    return (
      <div style={scaleStyle}>
        {tiles}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 ${
        showFeedback
          ? isCorrect
            ? "border-green-500 bg-green-50"
            : "border-red-500 bg-red-50"
          : "border-surface-200"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {renderItemTiles()}
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
        {isWrong && (
          <span className="text-xs font-bold text-red-600">
            {t("correctAnswer", { fu: item.fu })}
          </span>
        )}
        <div className="flex justify-end gap-1">
          {FU_OPTIONS.map((opt) => {
            const isSelected = answer === String(opt);
            const disabled = showFeedback || isCountingDown;

            let buttonClass =
              "rounded-lg border px-1.5 py-1 text-xs font-bold transition-colors";

            // bg-*-50 で統一（feedback-styles.ts や他練習の行ボーダーと一致させる）
            if (showFeedback && isSelected) {
              buttonClass += isCorrect
                ? " border-green-500 bg-green-50 text-green-700"
                : " border-red-500 bg-red-50 text-red-700";
            } else if (isSelected) {
              buttonClass +=
                " border-blue-500 bg-blue-100 text-blue-700";
            } else {
              buttonClass +=
                " border-surface-200 bg-white text-surface-600";
            }

            if (disabled) {
              buttonClass += " cursor-not-allowed opacity-60";
            }

            return (
              <button
                key={opt}
                type="button"
                className={buttonClass}
                disabled={disabled}
                onClick={() => handleButtonClick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
