"use client";

import { useTranslations } from "next-intl";

interface DetailItem {
  readonly name: string;
  readonly value: number;
}

interface DetailsToggleButtonProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly panelId: string;
}

interface DetailsPanelRowProps {
  readonly items: readonly DetailItem[];
  readonly total: number;
  readonly suffix: string;
  readonly panelId: string;
  readonly colSpan: number;
  readonly roundedTotal?: number;
  readonly roundUpLabel?: string;
}

/**
 * 詳細アコーディオンの開閉ボタン
 *
 * 開閉ボタンとパネルはコンポーネントを分けている。パネルは `<tr>` なので
 * `<tbody>` の直下にしか置けず、セル内に置くボタンと同じ要素にまとめると
 * `<td>` の中に `<tr>` が入り hydration error になるため。
 * 呼び出し側で `<td>` の中にこれを置き、その行の直後に
 * {@link DetailsPanelRow} を置くこと。
 */
export function DetailsToggleButton({
  isOpen,
  onToggle,
  panelId,
}: DetailsToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className="ml-2 text-xs font-normal text-primary-600 hover:text-primary-800 focus:outline-none"
    >
      {isOpen ? "\u25B2" : "\u25BC"}
    </button>
  );
}

/**
 * 詳細アコーディオンの展開パネル行
 * 符詳細・役詳細の展開表示
 */
export function DetailsPanelRow({
  items,
  total,
  suffix,
  panelId,
  colSpan,
  roundedTotal,
  roundUpLabel,
}: DetailsPanelRowProps) {
  const t = useTranslations("score");

  return (
    <tr id={panelId}>
      <td colSpan={colSpan} className="py-2">
        <div className="rounded-md bg-white px-2 py-0 text-xs text-surface-600">
          <div>
            {items.map((detail, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b-2 border-dashed border-border/40 py-1.5 last:border-0"
              >
                <span>{detail.name}</span>
                <span>
                  {detail.value}
                  {suffix}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-0 flex justify-between border-t-2 border-border pb-1.5 pt-1.5 font-bold">
            <span>{t("result.details.total")}</span>
            <span>
              {total}
              {suffix}
            </span>
          </div>
          {roundedTotal !== undefined && total !== roundedTotal && (
            <div className="mt-1 text-right text-[10px] text-surface-400">
              {total}
              {suffix} → {roundedTotal}
              {suffix} ({roundUpLabel})
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export type { DetailItem, DetailsToggleButtonProps, DetailsPanelRowProps };
