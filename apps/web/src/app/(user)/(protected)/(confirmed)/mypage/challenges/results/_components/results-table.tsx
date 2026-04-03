import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

import type { ChallengeSession } from "../../_lib/types";

interface ResultsTableProps {
  readonly items: readonly ChallengeSession[];
  readonly menuType: PracticeMenuType | undefined;
  readonly emptyMessage: string;
  readonly headers: {
    readonly date: string;
    readonly menu: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
  readonly formatDate: (date: Date | undefined) => string;
  readonly getMissColorClass: (incorrectAnswers: number) => string;
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
  formatDate,
  getMissColorClass,
  getMenuLabel,
}: ResultsTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-surface-500 text-center py-8">{emptyMessage}</p>
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
            <th className="text-left py-2 px-2 sm:px-3 text-surface-500 font-medium whitespace-nowrap">
              {headers.menu}
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
          {items.map((item) => (
            <tr key={item.id} className="border-b border-surface-100">
              <td className="py-2 px-2 sm:px-3 text-surface-900">
                {formatDate(item.createdAt)}
              </td>
              <td className="py-2 px-2 sm:px-3 text-surface-900">
                {getMenuLabel(item.menuType)}
              </td>
              <td className="py-2 px-2 sm:px-3 text-right text-surface-900">
                {item.score}
              </td>
              <td
                className={`py-2 px-2 sm:px-3 text-right ${getMissColorClass(item.incorrectAnswers)}`}
              >
                {item.incorrectAnswers}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
