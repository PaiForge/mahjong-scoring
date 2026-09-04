import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "../../_components/compact-table";
import { formatDate, getMissColorClass } from "../../_lib/dashboard-utils";
import type { ChallengeAttempt } from "../../_lib/types";

interface ResultsTableProps {
  readonly items: readonly ChallengeAttempt[];
  readonly emptyMessage: string;
  readonly headers: {
    readonly date: string;
    readonly menu: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
  /** menuType を表示ラベルへ変換する（i18n は呼び出し元の名前空間で行う） */
  readonly getMenuLabel: (menuType: string) => string;
}

/**
 * チャレンジ全履歴のテーブル。ページネーションはページコンポーネント側で処理。
 * 結果テーブル
 */
export function ResultsTable({
  items,
  emptyMessage,
  headers,
  getMenuLabel,
}: ResultsTableProps) {
  if (items.length === 0) {
    return <p className="text-surface-500 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <CompactTable
      head={
        <>
          <CompactTableHeaderCell>{headers.date}</CompactTableHeaderCell>
          <CompactTableHeaderCell>{headers.menu}</CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            {headers.correctAnswers}
          </CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            {headers.incorrectAnswers}
          </CompactTableHeaderCell>
        </>
      }
    >
      {items.map((item) => (
        <CompactTableRow key={item.id}>
          <CompactTableCell>{formatDate(item.createdAt)}</CompactTableCell>
          <CompactTableCell>{getMenuLabel(item.menuType)}</CompactTableCell>
          <CompactTableCell align="right">{item.score}</CompactTableCell>
          <CompactTableCell
            align="right"
            className={getMissColorClass(item.incorrectAnswers)}
          >
            {item.incorrectAnswers}
          </CompactTableCell>
        </CompactTableRow>
      ))}
    </CompactTable>
  );
}
