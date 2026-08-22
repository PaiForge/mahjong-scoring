import type { ReactNode } from "react";

/** 文字寄せ。Tailwind の検出対象になるよう class 名は静的に持つ */
const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
} as const;

type Align = keyof typeof ALIGN_CLASSES;

/**
 * チャレンジ履歴まわりの詰まった表の外枠
 * コンパクトテーブル
 *
 * `(user)/_components/data-table.tsx` の `DataTable` より余白と枠線が
 * 軽い系統で、マイページのチャレンジ履歴（本体とスケルトン）で共有する。
 * 本体とスケルトンで行の高さがずれるとスケルトンが CLS を防げなくなるため、
 * 双方がこのコンポーネントを通ること。
 */
export function CompactTable({
  head,
  children,
}: {
  /** 見出し行の中身（{@link CompactTableHeaderCell} 群） */
  readonly head: ReactNode;
  /** 本体の行（{@link CompactTableRow} 群） */
  readonly children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-3 border-ink">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** 見出しセル */
export function CompactTableHeaderCell({
  align = "left",
  children,
}: {
  readonly align?: Align;
  readonly children?: ReactNode;
}) {
  return (
    <th
      className={`py-2 px-2 sm:px-3 ${ALIGN_CLASSES[align]} text-surface-500 font-medium whitespace-nowrap`}
    >
      {children}
    </th>
  );
}

/** 本体の行 */
export function CompactTableRow({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <tr className="border-b-2 border-dashed border-border/40">{children}</tr>
  );
}

/** 本体のセル */
export function CompactTableCell({
  align = "left",
  className = "text-surface-900",
  children,
}: {
  readonly align?: Align;
  /** 文字色などの上書き。余白・枠線は上書きしない */
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <td className={`py-2 px-2 sm:px-3 ${ALIGN_CLASSES[align]} ${className}`}>
      {children}
    </td>
  );
}
