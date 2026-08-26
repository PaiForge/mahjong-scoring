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
  /**
   * 「わからない」で正解を開示中か
   *
   * 無回答のまま showFeedback が立つため、そのままだと全行が誤答の赤になる。
   * 開示中は誤答の演出を出さず、正解の符だけを示す。
   */
  readonly isRevealed?: boolean;
  readonly isCountingDown: boolean;
  /**
   * 和了牌として枠を付ける牌の位置（この要素で和了していなければ undefined）
   *
   * 手牌表示で和了牌に付けるのと同じ枠を、回答行の牌にも付ける。
   */
  readonly highlightedTileIndex?: number;
  readonly onSelect: (index: number, value: string) => void;
  readonly tileScale?: number;
}

/**
 * 符計算の個別要素行
 * 符要素行
 */
export const FuItemRow = memo(function FuItemRowComponent({
  index,
  item,
  answer,
  showFeedback,
  isRevealed = false,
  isCountingDown,
  highlightedTileIndex,
  onSelect,
  tileScale,
}: FuItemRowProps) {
  const t = useTranslations("tehaiFu");
  const answerNum = answer ? parseInt(answer) : undefined;
  const isCorrect = showFeedback && !isRevealed && answerNum === item.fu;
  const isWrong = showFeedback && !isRevealed && answerNum !== item.fu;

  const handleButtonClick = useCallback(
    (value: number) => {
      onSelect(index, String(value));
    },
    [onSelect, index],
  );

  const scaleStyle =
    tileScale !== undefined && tileScale < 1
      ? { transform: `scale(${tileScale})`, transformOrigin: "left center" }
      : undefined;

  const renderItemTiles = () => {
    const tiles =
      item.originalMentsu &&
      (item.isOpen || item.type === MentsuType.Kantsu) ? (
        <Furo
          mentsu={item.originalMentsu}
          furo={item.originalMentsu.furo}
          size="sm"
        />
      ) : (
        <div className="flex gap-0.5">
          {item.tiles.map((tile, i) => (
            <Hai
              key={i}
              hai={tile}
              size="sm"
              highlighted={i === highlightedTileIndex}
            />
          ))}
        </div>
      );

    if (!scaleStyle) return tiles;

    return <div style={scaleStyle}>{tiles}</div>;
  };

  return (
    <div
      className={`space-y-2.5 rounded-xl border bg-white p-3 ${
        !showFeedback || isRevealed
          ? "border-surface-200"
          : isCorrect
            ? "border-primary-500 bg-primary-50"
            : "border-destructive bg-destructive-subtle"
      }`}
    >
      {/* 面子の牌（左）と、誤答時の正解表示（右） */}
      <div className="flex min-w-0 items-center gap-2">
        {renderItemTiles()}
        {(isWrong || isRevealed) && (
          <span
            className={`ml-auto shrink-0 text-xs font-bold ${
              isRevealed ? "text-surface-600" : "text-destructive"
            }`}
          >
            {t("correctAnswer", { fu: item.fu })}
          </span>
        )}
      </div>

      {/* 符の選択肢。牌の下に全幅で並べ、タップしやすい大きさにする */}
      <div className="grid grid-cols-6 gap-1.5">
        {FU_OPTIONS.map((opt) => {
          const isSelected = answer === String(opt);
          const disabled = showFeedback || isCountingDown;

          let buttonClass =
            "rounded-lg border py-2.5 text-sm font-bold transition-colors";

          // bg-*-50 で統一（feedback-styles.ts や他練習の行ボーダーと一致させる）
          // 開示中は選択が無いため、正解の符のボタンを正解色で示す
          if (isRevealed) {
            buttonClass +=
              opt === item.fu
                ? " border-primary-500 bg-primary-50 text-primary-700"
                : " border-surface-200 bg-white text-surface-600";
          } else if (showFeedback && isSelected) {
            buttonClass += isCorrect
              ? " border-primary-500 bg-primary-50 text-primary-700"
              : " border-destructive bg-destructive-subtle text-destructive-strong";
          } else if (isSelected) {
            buttonClass += " border-blue-500 bg-blue-100 text-blue-700";
          } else {
            buttonClass += " border-surface-200 bg-white text-surface-600";
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
  );
});
