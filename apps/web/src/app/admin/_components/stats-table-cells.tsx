/** 数値のセル（右寄せ・桁揃え） */
export const NUMBER_CELL_CLASSES =
  "px-4 py-3 text-right whitespace-nowrap tabular-nums";

/**
 * 累計の数に横棒を添えたセル
 * 累計セル
 *
 * @design 横棒は「表の中での相対的な多さ」だけを表す
 * 幅は `total / maxTotal`（表の最大を 100%）。数字が本体なので棒は `aria-hidden`。
 *
 * @param maxTotal - 横棒の分母（全行の total の最大）。0 なら棒は出ない
 */
export function TotalBarCell({
  total,
  maxTotal,
}: {
  readonly total: number;
  readonly maxTotal: number;
}) {
  const ratio = maxTotal === 0 ? 0 : total / maxTotal;
  return (
    <td className={NUMBER_CELL_CLASSES}>
      <span className="block">{total.toLocaleString("ja-JP")}</span>
      <span
        aria-hidden="true"
        className="mt-1 ml-auto block h-1.5 w-24 overflow-hidden rounded-full bg-surface-100"
      >
        <span
          className="block h-full rounded-full bg-primary-600"
          style={{ width: `${String(ratio * 100)}%` }}
        />
      </span>
    </td>
  );
}

/**
 * 現在の定義に無い行の名前のセル
 * 未知の行セル
 *
 * 辞書キーは定義にある値にしか無いので、生の値を `<code>` で出し、注記を添える。
 *
 * @param value - 生の値
 * @param note - 注記（辞書から引いた文言）
 */
export function UnknownValueCell({
  value,
  note,
}: {
  readonly value: string;
  readonly note: string;
}) {
  return (
    <td className="px-4 py-3">
      <span className="space-y-1">
        <code className="block">{value}</code>
        <span className="block text-xs text-surface-500">{note}</span>
      </span>
    </td>
  );
}
