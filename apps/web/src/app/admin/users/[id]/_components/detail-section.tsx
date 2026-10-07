import type { ReactNode } from "react";

/**
 * ユーザー詳細の 1 区画（見出し + 枠）
 * 詳細セクション
 */
export function DetailSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="admin-panel space-y-3 p-5">
      <h3 className="text-sm font-bold text-surface-900">{title}</h3>
      {children}
    </section>
  );
}

/**
 * 詳細セクション内の「項目名: 値」の 1 行。`<dl>` の中に置く
 * 項目行
 */
export function InfoRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-surface-100 py-2 text-sm first:border-t-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-surface-500 sm:w-36">{label}</dt>
      <dd className="min-w-0 break-all">{children}</dd>
    </div>
  );
}

/** 詳細セクション内の小さな表。0 件なら `emptyLabel` を出す */
export function DetailTable({
  headers,
  isEmpty,
  emptyLabel,
  children,
}: {
  readonly headers: readonly string[];
  readonly isEmpty: boolean;
  readonly emptyLabel: string;
  readonly children: ReactNode;
}) {
  if (isEmpty) {
    return <p className="text-sm text-surface-500">{emptyLabel}</p>;
  }
  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 font-medium whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
