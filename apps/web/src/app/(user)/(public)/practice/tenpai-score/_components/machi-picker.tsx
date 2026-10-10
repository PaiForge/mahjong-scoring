"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { haiIdToMpsz } from "@mahjong-scoring/core";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import {
  MACHI_TILE_MARK_CLASSES,
  machiTileMark,
  type MachiTileMark,
} from "@mahjong-scoring/features/practice/tenpai-score/machi-tile-mark";
import { MACHI_PICKER_ROWS } from "@mahjong-scoring/features/practice/tenpai-score/picker-rows";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";

/**
 * 牌の枠と背景。押せる面なので ChoiceButton と同じ細枠 + hover の塗り。
 * 選んだ牌は枠の内側に 1px のリングを足して 2px の緑で囲み、塗りだけに
 * 頼らず選択中であることを示す（枠の幅は変えないので牌は動かない）。
 * 判定後は正誤の配色（答え合わせと共通の `MACHI_TILE_MARK_CLASSES`）に
 * 切り替え、待ちでも選んでもいない牌は薄くする。
 */
function tileClasses(
  selected: boolean,
  mark: MachiTileMark | undefined,
  judged: boolean,
): string {
  if (!judged) {
    return selected
      ? "border-primary-500 bg-primary-50 ring-1 ring-inset ring-primary-500"
      : "border-surface-300 bg-white hover:border-primary-300 hover:bg-primary-50";
  }
  return mark
    ? MACHI_TILE_MARK_CLASSES[mark]
    : "border-surface-300 bg-white opacity-40";
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
 * 判定後は牌ごとに枠の色で「正解（緑）/ 待ちではない（赤）/ 見落とし
 * （緑の破線）」を示し、1 枚余分なだけで全体が赤くならないようにする。
 * 文字は添えない — 牌の下に 1 行足すと選択肢の高さが変わり、判定の瞬間に
 * 下のボタンがずれる。
 */
export const MachiPicker = memo(function MachiPickerComponent({
  selected,
  onToggle,
  judgement,
  disabled = false,
}: MachiPickerProps) {
  const t = useTranslations("tenpaiScore.machi");
  const judged = judgement !== undefined;

  return (
    <div className="space-y-2">
      {MACHI_PICKER_ROWS.map((row) => (
        <div
          key={row.key}
          role="group"
          aria-label={t(`suits.${row.key}`)}
          className="grid grid-cols-9 gap-1 sm:gap-2"
        >
          {row.tiles.map((hai) => {
            const isSelected = selected.includes(hai);
            const mark = machiTileMark(hai, isSelected, judgement);
            return (
              <button
                key={hai}
                type="button"
                disabled={disabled || judged}
                aria-pressed={isSelected}
                aria-label={haiIdToMpsz(hai)}
                onClick={() => onToggle(hai)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-0.5 py-1 transition-colors sm:min-h-16 sm:rounded-xl ${FOCUS_RING_CLASSES} ${tileClasses(isSelected, mark, judged)}`}
              >
                <span className="origin-center scale-75 sm:scale-100">
                  <Hai hai={hai} size="sm" />
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});
