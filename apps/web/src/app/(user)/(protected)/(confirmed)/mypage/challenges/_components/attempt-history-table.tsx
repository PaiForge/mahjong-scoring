import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "./compact-table";
import { getMissColorClass } from "../_lib/dashboard-utils";
import type { AttemptRow } from "../_lib/types";

interface AttemptHistoryTableProps {
  readonly attempts: readonly AttemptRow[];
  readonly emptyMessage: string;
  readonly headers: {
    readonly date: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
}

/**
 * 直近のチャレンジ履歴を表示するテーブル。ミス数に応じて色分けする。
 * チャレンジ履歴テーブル
 */
export function AttemptHistoryTable({
  attempts,
  emptyMessage,
  headers,
}: AttemptHistoryTableProps) {
  if (attempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-surface-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <CompactTable
      head={
        <>
          <CompactTableHeaderCell>{headers.date}</CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            {headers.correctAnswers}
          </CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            {headers.incorrectAnswers}
          </CompactTableHeaderCell>
        </>
      }
    >
      {attempts.map((attempt) => (
        <CompactTableRow
          key={`${attempt.date}-${attempt.correctAnswers}-${attempt.incorrectAnswers}`}
        >
          <CompactTableCell>{attempt.date}</CompactTableCell>
          <CompactTableCell align="right">
            {attempt.correctAnswers}
          </CompactTableCell>
          <CompactTableCell
            align="right"
            className={getMissColorClass(attempt.incorrectAnswers)}
          >
            {attempt.incorrectAnswers}
          </CompactTableCell>
        </CompactTableRow>
      ))}
    </CompactTable>
  );
}
