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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSelect(index, e.target.value);
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
      <div className="flex items-center gap-2">
        {renderItemTiles()}
        {item.type === "Pair" && (
          <span className="text-xs text-surface-400">{t("pair")}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isWrong && (
          <span className="text-xs font-bold text-red-600">
            {item.fu}符
          </span>
        )}
        <select
          className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold ${
            showFeedback
              ? isCorrect
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
              : "border-surface-200"
          }`}
          value={answer}
          onChange={handleChange}
          disabled={showFeedback || isCountingDown}
        >
          <option value="" disabled>
            --
          </option>
          {FU_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}符
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
