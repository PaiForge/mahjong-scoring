"use client";

import { useTranslations } from "next-intl";
import { MentsuType } from "@mahjong-scoring/core";
import type { TehaiFuItem } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";

const FU_OPTIONS = [0, 2, 4, 8, 16, 32] as const;

interface FuItemRowProps {
  readonly item: TehaiFuItem;
  readonly answer: string;
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly onSelect: (value: string) => void;
}

/**
 * 符計算の個別要素行
 * 符要素行
 */
export function FuItemRow({
  item,
  answer,
  showFeedback,
  isCountingDown,
  onSelect,
}: FuItemRowProps) {
  const t = useTranslations("tehaiFu");
  const answerNum = answer ? parseInt(answer) : undefined;
  const isCorrect = showFeedback && answerNum === item.fu;
  const isWrong = showFeedback && answerNum !== item.fu;

  const renderItemTiles = () => {
    if (item.originalMentsu && (item.isOpen || item.type === MentsuType.Kantsu)) {
      return (
        <Furo
          mentsu={item.originalMentsu}
          furo={item.originalMentsu.furo}
          size="sm"
        />
      );
    }

    return (
      <div className="flex gap-0.5">
        {item.tiles.map((tile, i) => (
          <Hai key={i} hai={tile} size="sm" />
        ))}
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
          onChange={(e) => onSelect(e.target.value)}
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
}
