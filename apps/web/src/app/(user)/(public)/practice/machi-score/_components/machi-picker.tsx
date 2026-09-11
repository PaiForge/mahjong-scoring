"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { HaiKind, haiIdToMspz } from "@mahjong-scoring/core";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";

/**
 * 牌種を種類ごとに並べた選択肢の行
 * 牌の行
 *
 * 数牌は 1〜9、字牌は東南西北白發中の順。牌種 ID は種類ごとに連番なので
 * 先頭の ID から 9 つ（字牌は 7 つ）を並べる。
 */
const TILE_ROWS = [
  { key: "manzu", from: HaiKind.ManZu1, count: 9 },
  { key: "pinzu", from: HaiKind.PinZu1, count: 9 },
  { key: "souzu", from: HaiKind.SouZu1, count: 9 },
  { key: "jihai", from: HaiKind.Ton, count: 7 },
] as const;

/** 行の牌種 ID を列挙する（ID は連番なので加算で足りる） */
function tilesOf(row: (typeof TILE_ROWS)[number]): readonly HaiKindId[] {
  const tiles: HaiKindId[] = [];
  for (const id of Object.values(HaiKind)) {
    if (id >= row.from && id < row.from + row.count) tiles.push(id);
  }
  return tiles;
}

/** 判定後の牌の状態 */
type TileMark = "correct" | "extra" | "missed" | undefined;

function markOf(
  hai: HaiKindId,
  selected: boolean,
  judgement: MachiSelectionJudgement | undefined,
): TileMark {
  if (!judgement) return undefined;
  if (judgement.extra.includes(hai)) return "extra";
  if (judgement.missed.includes(hai)) return "missed";
  if (selected && judgement.correct.includes(hai)) return "correct";
  return undefined;
}

/**
 * 牌の枠と背景。押せる面なので太枠 + 押し込み演出（ChoiceButton と同じ語彙）。
 * 判定後は正誤の配色に切り替え、待ちでも選んでもいない牌は薄くする。
 */
function tileClasses(
  selected: boolean,
  mark: TileMark,
  judged: boolean,
): string {
  if (!judged) {
    return selected
      ? "border-primary-500 bg-primary-50"
      : "border-ink bg-white hover:bg-primary-50";
  }
  switch (mark) {
    case "correct":
      return "border-success bg-success-subtle";
    case "extra":
      return "border-destructive bg-destructive-subtle";
    case "missed":
      return "border-success border-dashed bg-white";
    default:
      return "border-ink bg-white opacity-40";
  }
}

interface MachiPickerProps {
  readonly selected: readonly HaiKindId[];
  readonly onToggle: (hai: HaiKindId) => void;
  /** 回答後の判定。渡すと正誤の配色で描き、押せなくする */
  readonly judgement?: MachiSelectionJudgement;
  readonly disabled?: boolean;
}

/**
 * 待ち牌を選ぶ 34 種の牌の一覧
 * 待ち牌選択
 *
 * 種類ごとに 1 行、狭い画面では 9 列がそのまま収まるよう牌を縮めて出す。
 * 判定後は選んだ牌ごとに「正解 / 待ちではない / 見落とし」を牌の下に添え、
 * 1 枚余分なだけで全体が赤くならないようにする。
 */
export const MachiPicker = memo(function MachiPickerComponent({
  selected,
  onToggle,
  judgement,
  disabled = false,
}: MachiPickerProps) {
  const t = useTranslations("machiScore.machi");
  const judged = judgement !== undefined;

  return (
    <div className="space-y-2">
      {TILE_ROWS.map((row) => (
        <div
          key={row.key}
          role="group"
          aria-label={t(`suits.${row.key}`)}
          className="grid grid-cols-9 gap-1 sm:gap-2"
        >
          {tilesOf(row).map((hai) => {
            const isSelected = selected.includes(hai);
            const mark = markOf(hai, isSelected, judgement);
            return (
              <button
                key={hai}
                type="button"
                disabled={disabled || judged}
                aria-pressed={isSelected}
                aria-label={haiIdToMspz(hai)}
                onClick={() => onToggle(hai)}
                className={`press-sm flex min-h-12 flex-col items-center justify-center rounded-lg border-2 px-0.5 py-1 sm:min-h-16 sm:rounded-xl sm:border-3 ${tileClasses(isSelected, mark, judged)}`}
              >
                <span className="origin-center scale-75 sm:scale-100">
                  <Hai hai={hai} size="sm" />
                </span>
                {/* 判定後だけ牌の下に状態を添える。空でも高さを取って行を揃える */}
                {judged && (
                  <span
                    className={`mt-0.5 h-3 text-[10px] font-bold leading-none ${
                      mark === "extra" ? "text-destructive" : "text-success"
                    }`}
                  >
                    {mark ? t(`marks.${mark}`) : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});
