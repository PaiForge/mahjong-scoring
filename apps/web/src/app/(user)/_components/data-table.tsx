import type { ReactNode } from "react";

/**
 * セルの配置クラスの対応表
 *
 * Tailwind はソース中のリテラルなクラス名しか検出しないため、
 * `text-${align}` のような動的生成をしてはいけない。
 * `center` は表側で `text-center` を指定する使い方に合わせて空にしている。
 */
export const DATA_TABLE_ALIGN_CLASS = {
  left: "text-left",
  right: "text-right",
  center: "",
} as const;

/** データテーブルのセル配置 */
export type DataTableAlign = keyof typeof DATA_TABLE_ALIGN_CLASS;

interface DataTableHeaderCellProps {
  /** セルの配置（既定は表の text-align に従う） */
  readonly align?: DataTableAlign;
  /** 追加クラス（ハイライト等）。レイアウトの上書きには使わない */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * データテーブルのヘッダーセル
 * テーブル見出しセル
 */
export function DataTableHeaderCell({
  align = "center",
  className,
  children,
}: DataTableHeaderCellProps) {
  const mergedClassName = [
    "px-4 py-3",
    DATA_TABLE_ALIGN_CLASS[align],
    "font-bold text-surface-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <th className={mergedClassName}>{children}</th>;
}

interface DataTableRowHeaderCellProps {
  readonly children: ReactNode;
}

/**
 * データテーブルの行見出しセル
 * テーブル行見出しセル
 *
 * 行の左端に置く見出し。ヘッダー行（{@link DataTableHeaderCell}）と違い本文の
 * 一部なので `td` で描き、値のセルより弱いコントラストにして左揃えで固定する。
 * 折り返すと表が縦に伸びて行の対応が読みにくくなるため、改行させない。
 */
export function DataTableRowHeaderCell({
  children,
}: DataTableRowHeaderCellProps) {
  return (
    <td className="px-4 py-3 text-left font-medium whitespace-nowrap text-surface-600">
      {children}
    </td>
  );
}

interface DataTableProps {
  /** ヘッダー行の中身（{@link DataTableHeaderCell} を並べる） */
  readonly header: ReactNode;
  /** ボディの行（`<tr>` を並べる） */
  readonly children: ReactNode;
  /** `<table>` に足すクラス（既定の text-align を変える場合など） */
  readonly tableClassName?: string;
}

/**
 * データテーブルの外枠
 * データテーブル
 *
 * 太枠＋オフセット影・ヘッダー行の背景・破線の行区切りというアプリ共通の表の体裁を
 * 1 箇所に集約する。教本の早見表と点数表リファレンスで共有する。
 * サーバー / クライアントどちらのコンポーネントからも使える。
 */
export function DataTable({
  header,
  children,
  tableClassName,
}: DataTableProps) {
  const className = ["w-full", tableClassName, "text-sm"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="overflow-hidden rounded-xl border-3 border-ink shadow-sm">
      <table className={className}>
        <thead>
          <tr className="border-b-3 border-ink bg-primary-50">{header}</tr>
        </thead>
        <tbody className="divide-y-2 divide-dashed divide-surface-200">
          {children}
        </tbody>
      </table>
    </div>
  );
}
