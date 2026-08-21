import { formatDate, getMissColorClass } from "../../_lib/dashboard-utils";
import type { ChallengeSession } from "../../_lib/types";

interface ResultsTableProps {
  readonly items: readonly ChallengeSession[];
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-3 border-ink">
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
            <tr
              key={item.id}
              className="border-b-2 border-dashed border-border/40"
            >
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
