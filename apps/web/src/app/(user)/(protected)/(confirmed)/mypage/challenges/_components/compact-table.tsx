import type { ReactNode } from "react";

/** 文字寄せ。Tailwind の検出対象になるよう class 名は静的に持つ */
const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
} as const;

type Align = keyof typeof ALIGN_CLASSES;

/**
 * 「日時」列の幅
 *
 * `formatDate` は "2026/09/19 08:22" を返す。sm 以上はこれが 1 行に収まる幅を
 * 取り、狭い画面では日付だけが 1 行に収まる幅にして時刻を 2 行目へ送る。
 * 日時を 1 行に収める幅を狭い画面でも取ると、そのぶん種目の列が痩せて
 * 「点数表早引き（親・満貫未満）」が 3 行に割れ、行の高さはかえって増える。
 */
const DATE_COLUMN = "w-24 sm:w-36";

/** 正解数・ミス数の列幅。見出し（「正解数」「ミス数」）が折り返さない最小限 */
const COUNT_COLUMN = "w-16 sm:w-20";

/**
 * 直近のチャレンジ履歴（日時 / 正解数 / ミス数）の列幅
 *
 * 日時は残りを全部もらう（この形には文字の列が他に無い）。
 */
export const ATTEMPT_HISTORY_COLUMNS = [
  undefined,
  COUNT_COLUMN,
  COUNT_COLUMN,
] as const;

/** チャレンジ全履歴（日時 / 種目 / 正解数 / ミス数）の列幅。残りは種目へ */
export const CHALLENGE_RESULTS_COLUMNS = [
  DATE_COLUMN,
  undefined,
  COUNT_COLUMN,
  COUNT_COLUMN,
] as const;

/**
 * チャレンジ履歴まわりの詰まった表の外枠
 * コンパクトテーブル
 *
 * `(user)/_components/data-table.tsx` の `DataTable` より余白と枠線が
 * 軽い系統で、マイページのチャレンジ履歴（本体とスケルトン）で共有する。
 * 本体とスケルトンで行の高さがずれるとスケルトンが CLS を防げなくなるため、
 * 双方がこのコンポーネントを通ること。
 *
 * 列幅も `columns`（{@link ATTEMPT_HISTORY_COLUMNS} /
 * {@link CHALLENGE_RESULTS_COLUMNS}）で決め打ちして双方で共有する。中身なりに
 * 決まる auto レイアウトでは、スケルトンの灰色の帯と実データとで列の境目が
 * 動いてしまう（390px の全履歴で実測: スケルトンの 96/96/96/96 が実データで
 * 121/121/58/58。数値の 2 列は左寄せから右寄せへ飛ぶ）。高さだけ合わせても、
 * 横に飛ぶならスケルトンは CLS を防げていない。ページ送りで種目名の文字数が
 * 変われば列幅が変わるのも同じ理由で止まる。
 */
export function CompactTable({
  columns,
  head,
  children,
}: {
  /** 列ごとの幅クラス。`undefined` の列が残りを分け合う */
  readonly columns: readonly (string | undefined)[];
  /** 見出し行の中身（{@link CompactTableHeaderCell} 群） */
  readonly head: ReactNode;
  /** 本体の行（{@link CompactTableRow} 群） */
  readonly children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          {columns.map((width, index) => (
            <col key={index} className={width} />
          ))}
        </colgroup>
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
