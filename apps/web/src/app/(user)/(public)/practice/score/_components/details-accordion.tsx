"use client";

import { useTranslations } from "next-intl";

import { DetailTable } from "../../_components/detail-table";

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
  /** 内訳の見出し（「翻数の内訳」「符の内訳」） */
  readonly title: string;
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
 *
 * 表そのものは {@link DetailTable} に委ねる。同じ内訳を結果ページの問題別
 * フィードバックでも出しており、出題直後とあとから見返すときで体裁が
 * 変わらないようにする。
 */
export function DetailsPanelRow({
  title,
  items,
  total,
  suffix,
  panelId,
  colSpan,
  roundedTotal,
  roundUpLabel,
}: DetailsPanelRowProps) {
  const t = useTranslations("score");
  const withSuffix = (value: number) => `${value}${suffix}`;

  return (
    <tr id={panelId}>
      <td colSpan={colSpan} className="py-2">
        <DetailTable
          title={title}
          rows={items.map((detail) => ({
            label: detail.name,
            value: withSuffix(detail.value),
          }))}
          total={{
            label: t("result.details.total"),
            value: withSuffix(total),
          }}
          note={
            roundedTotal !== undefined && total !== roundedTotal
              ? `${withSuffix(total)} \u2192 ${withSuffix(roundedTotal)}（${roundUpLabel}）`
              : undefined
          }
        />
      </td>
    </tr>
  );
}

export type { DetailItem, DetailsToggleButtonProps, DetailsPanelRowProps };
