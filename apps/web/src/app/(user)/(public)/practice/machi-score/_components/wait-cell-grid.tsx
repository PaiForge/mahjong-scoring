"use client";

import { useTranslations } from "next-intl";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { cellKeyOf, type MachiCellRef } from "../_hooks/use-machi-score-store";
import { MACHI_SCORE_TOUR_ID } from "../_lib/tour-ids";

interface WaitCellGridProps {
  readonly question: MachiScoreQuestion;
  /** マスごとの回答（キーは `cellKeyOf`） */
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  readonly selectedCells: readonly MachiCellRef[];
  /** 回答を 1 行にする（親ツモの「オール」など表示の都合は呼び出し側が持つ） */
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  readonly onToggleCell: (cell: MachiCellRef) => void;
  readonly onSelectColumn: (isTsumo: boolean) => void;
  readonly disabled?: boolean;
}

/** マスの枠と背景。選択中は緑、回答済みは太枠、未回答は破線 */
function cellClasses(isSelected: boolean, isAnswered: boolean): string {
  if (isSelected) return "border-primary-500 bg-primary-50 text-surface-900";
  if (isAnswered) return "border-ink bg-white text-surface-900";
  return "border-dashed border-surface-300 bg-surface-50 text-surface-400";
}

/**
 * 待ち × ツモ/ロン のマスの表
 * 待ちマス表
 *
 * 行が待ち牌、列が和了方法。マスを押すと選択に入り、回答フォームで入れた
 * 点数が選択中のマスすべてに当てはまる。列の見出しの「すべて選ぶ」で
 * 未回答のマスを列ごと選べる（3 面待ちで全部同じ点数のときに 1 回で済む）。
 */
export function WaitCellGrid({
  question,
  cellAnswers,
  selectedCells,
  formatAnswer,
  onToggleCell,
  onSelectColumn,
  disabled = false,
}: WaitCellGridProps) {
  const t = useTranslations("machiScore.cells");
  const selectedKeys = new Set(selectedCells.map(cellKeyOf));

  const renderCell = (cell: MachiCellRef) => {
    const key = cellKeyOf(cell);
    const answer = cellAnswers[key];
    const isSelected = selectedKeys.has(key);
    return (
      <td key={key} className="p-1 sm:p-1.5">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={isSelected}
          onClick={() => onToggleCell(cell)}
          className={`press-sm flex min-h-14 w-full items-center justify-center rounded-lg border-3 px-2 py-2 text-center text-sm font-bold leading-snug ${cellClasses(isSelected, answer !== undefined)}`}
        >
          {answer ? formatAnswer(answer, cell.isTsumo) : t("unanswered")}
        </button>
      </td>
    );
  };

  const renderColumnHeader = (isTsumo: boolean) => (
    <th scope="col" className="px-1 pb-2 text-center align-bottom">
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-surface-700">
          {t(isTsumo ? "tsumo" : "ron")}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectColumn(isTsumo)}
          className={`text-xs ${TEXT_LINK_CLASSES}`}
        >
          {t("selectColumn")}
        </button>
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto" data-tour-id={MACHI_SCORE_TOUR_ID.cells}>
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="w-14 px-1 pb-2 text-center align-bottom">
              <span className="text-sm font-bold text-surface-700">
                {t("wait")}
              </span>
            </th>
            {renderColumnHeader(true)}
            {renderColumnHeader(false)}
          </tr>
        </thead>
        <tbody>
          {question.waits.map((wait) => (
            <tr key={wait.agariHai}>
              <th scope="row" className="p-1 text-center align-middle">
                <span className="inline-flex justify-center">
                  <Hai hai={wait.agariHai} size="sm" />
                </span>
              </th>
              {renderCell({ agariHai: wait.agariHai, isTsumo: true })}
              {renderCell({ agariHai: wait.agariHai, isTsumo: false })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
