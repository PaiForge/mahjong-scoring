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

/**
 * セルの余白クラスの対応表
 *
 * 既定は左右 px-4。列の多い数表（点数早見表）は狭い画面でこれだと横に収まらず、
 * はみ出した分をブラウザが見出しの折り返しで吸収してしまう
 * （「符＼翻」が「符＼」と「翻」の2行に割れる）。そういう表は `dense` を選び、
 * sm 未満でだけ左右を詰めて列そのものを細くする。
 */
export const DATA_TABLE_CELL_PADDING = {
  default: "px-4 py-3",
  dense: "px-2 py-3 sm:px-4",
} as const;

/** データテーブルのセル余白 */
export type DataTableDensity = keyof typeof DATA_TABLE_CELL_PADDING;

interface DataTableHeaderCellProps {
  /** セルの配置（既定は表の text-align に従う） */
  readonly align?: DataTableAlign;
  /** セルの余白（既定は px-4。狭い画面で収まらない数表は "dense"） */
  readonly density?: DataTableDensity;
  /** 追加クラス（ハイライト等）。レイアウトの上書きには使わない */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * データテーブルのヘッダーセル
 * テーブル見出しセル
 *
 * 見出しは「符＼翻」「3翻」のように、それ以上分けると意味を失う短い語なので
 * 改行させない（{@link DataTableRowHeaderCell} と同じ理由）。列見出しは表の中で
 * 一番縮められる列でもあるため、放っておくとブラウザは幅の不足をここの折り返しで
 * 吸収し、語が途中で割れる。幅が足りない表は折り返しではなく
 * {@link DATA_TABLE_CELL_PADDING} の `dense` で列を細くして合わせる。
 */
export function DataTableHeaderCell({
  align = "center",
  density = "default",
  className,
  children,
}: DataTableHeaderCellProps) {
  const mergedClassName = [
    DATA_TABLE_CELL_PADDING[density],
    DATA_TABLE_ALIGN_CLASS[align],
    "font-bold whitespace-nowrap text-surface-700",
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
 * 太枠・ヘッダー行の背景・破線の行区切りというアプリ共通の表の体裁を
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
    <div className="overflow-hidden rounded-xl border-3 border-ink">
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
