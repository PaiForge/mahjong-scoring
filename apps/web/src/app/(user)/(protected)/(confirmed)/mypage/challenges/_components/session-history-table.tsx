import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "./compact-table";
import { getMissColorClass } from "../_lib/dashboard-utils";
import type { SessionRow } from "../_lib/types";

interface SessionHistoryTableProps {
  readonly sessions: readonly SessionRow[];
  readonly emptyMessage: string;
  readonly headers: {
    readonly date: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
}

/**
 * 直近のセッション履歴を表示するテーブル。ミス数に応じて色分けする。
 * セッション履歴テーブル
 */
export function SessionHistoryTable({
  sessions,
  emptyMessage,
  headers,
}: SessionHistoryTableProps) {
  if (sessions.length === 0) {
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
      {sessions.map((session) => (
        <CompactTableRow
          key={`${session.date}-${session.correctAnswers}-${session.incorrectAnswers}`}
        >
          <CompactTableCell>{session.date}</CompactTableCell>
          <CompactTableCell align="right">
            {session.correctAnswers}
          </CompactTableCell>
          <CompactTableCell
            align="right"
            className={getMissColorClass(session.incorrectAnswers)}
          >
            {session.incorrectAnswers}
          </CompactTableCell>
        </CompactTableRow>
      ))}
    </CompactTable>
  );
}
