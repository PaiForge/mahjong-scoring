import type { YakuSelectionState } from "@mahjong-scoring/core";
import { YAKU_SELECTION_CLASSES } from "../../_lib/yaku-selection-classes";

interface YakuChipProps {
  /** 画面に出す表示名。選択モーダルと同じ名前を出すため呼び出し側で解決する */
  readonly label: string;
  /** その役をどう扱ったか（core の `judgeYakuName` が決める） */
  readonly feedbackState: YakuSelectionState;
  /**
   * 押したときの動作（役一覧をその役で開く）。渡すとチップがボタンになる。
   * 早見表に載らない役（状況役）は渡さず、ただの文字のままにする
   */
  readonly onSelect?: () => void;
  /** 押すと何が起きるかの補足（`onSelect` を渡すときの title） */
  readonly title?: string;
}

const CHIP_CLASSES =
  "inline-block rounded-full border px-3 py-1.5 text-xs font-medium select-none";

/**
 * 答え合わせの役チップ
 * 役チップ
 *
 * 役を選ぶのは {@link import("./yaku-select-list").YakuSelectList } の役目で、
 * 答え合わせで並ぶこのチップは選択を変えない。押せるのは `onSelect` を
 * 渡したときだけで、その場合は点数計算の結果表示の役チップと同じく
 * 役一覧モーダルをその役で開く（「その役がどんな形か」を確かめる導線）。
 */
export function YakuChip({
  label,
  feedbackState,
  onSelect,
  title,
}: YakuChipProps) {
  const className = `${CHIP_CLASSES} ${YAKU_SELECTION_CLASSES[feedbackState]}`;

  if (onSelect === undefined) {
    return <span className={className}>{label}</span>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      title={title}
      className={`${className} cursor-pointer hover:underline`}
    >
      {label}
    </button>
  );
}
