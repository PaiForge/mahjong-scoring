import type { YakuSelectionState } from "@mahjong-scoring/core";
import { YAKU_SELECTION_CLASSES } from "../../_lib/yaku-selection-classes";

interface YakuChipProps {
  /** 画面に出す表示名。選択モーダルと同じ名前を出すため呼び出し側で解決する */
  readonly label: string;
  /** その役をどう扱ったか（core の `judgeYakuName` が決める） */
  readonly feedbackState: YakuSelectionState;
}

/**
 * 答え合わせの役チップ
 * 役チップ
 *
 * 表示専用。役を選ぶのは {@link import("./yaku-select-list").YakuSelectList } の
 * 役目で、答え合わせで並ぶこのチップは押せない。
 */
export function YakuChip({ label, feedbackState }: YakuChipProps) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium select-none ${YAKU_SELECTION_CLASSES[feedbackState]}`}
    >
      {label}
    </span>
  );
}
