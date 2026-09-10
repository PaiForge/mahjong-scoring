import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "../../_components/compact-table";
import { getMissColorClass } from "@/app/(user)/_components/_lib/miss-color";
import { formatDate } from "../../_lib/dashboard-utils";
import type { ChallengeAttempt, RecordBoard } from "../../_lib/types";

interface ResultsTableProps {
  readonly items: readonly ChallengeAttempt[];
  readonly emptyMessage: string;
  readonly headers: {
    readonly date: string;
    readonly menu: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
  /** 土俵（練習種別 × バリアント）を表示ラベルへ変換する（i18n は呼び出し元で行う） */
  readonly getBoardLabel: (board: RecordBoard) => string;
}

/**
 * チャレンジ全履歴のテーブル。ページネーションはページコンポーネント側で処理。
 * 結果テーブル
 */
export function ResultsTable({
  items,
  emptyMessage,
  headers,
  getBoardLabel,
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
          <CompactTableCell>{getBoardLabel(item)}</CompactTableCell>
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
