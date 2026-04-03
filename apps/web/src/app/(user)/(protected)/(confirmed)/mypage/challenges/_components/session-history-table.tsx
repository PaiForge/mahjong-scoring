import { getMissColorClass } from "../_lib/dashboard-utils";

interface SessionRow {
  readonly date: string;
  readonly correctAnswers: string;
  readonly incorrectAnswers: number;
}

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-2 px-2 sm:px-3 text-surface-500 font-medium">
              {headers.date}
            </th>
            <th className="text-right py-2 px-2 sm:px-3 text-surface-500 font-medium whitespace-nowrap">
              {headers.correctAnswers}
            </th>
            <th className="text-right py-2 px-2 sm:px-3 text-surface-500 font-medium whitespace-nowrap">
              {headers.incorrectAnswers}
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={`${session.date}-${session.correctAnswers}-${session.incorrectAnswers}`} className="border-b border-surface-100">
              <td className="py-2 px-2 sm:px-3 text-surface-900">
                {session.date}
              </td>
              <td className="py-2 px-2 sm:px-3 text-right text-surface-900">
                {session.correctAnswers}
              </td>
              <td
                className={`py-2 px-2 sm:px-3 text-right ${getMissColorClass(session.incorrectAnswers)}`}
              >
                {session.incorrectAnswers}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
