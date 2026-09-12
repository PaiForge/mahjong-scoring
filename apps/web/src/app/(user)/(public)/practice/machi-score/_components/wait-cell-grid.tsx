"use client";

import { useTranslations } from "next-intl";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
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
 * 点数が選択中のマスすべてに当てはまる。同じ列のマスは押して足していく
 * だけで、列ごとまとめて選ぶ入口は置かない — 待ちは 2〜3 面がほとんどで
 * 省けるのは 1〜2 タップにすぎず、「どの待ちが同じ点数か」を決めて
 * マスを組むこと自体がこの練習の中身なので、全部同じと決め打ちする
 * 近道を用意しない。
 *
 * 選択中のマスは「回答中」。同じ列で縦に隣り合う選択中のマスは `rowSpan`
 * で 1 つのマスにつなげ「まとめて回答中」を 1 つだけ出す — 「未回答 /
 * 未回答」と割れていたものが押した瞬間に 1 枚になることで、これらが同じ
 * 答えになる（1 回の入力で済む）と見た目で伝える。文言だけだと
 * 「選択中: 2 マス」と同じで読み飛ばされる。当てはめると 1 マスずつに戻る
 * （答え合わせは別々に ✓/✗ が付くため、塊は選択中だけの姿）。塊を押すと
 * 塊ごと選択が解ける — 1 枚になったものの一部だけを外す操作は作れず、
 * 2〜3 マスなら選び直しは安い。間を空けて選んだ（真ん中を跨ぐ）場合は
 * つながらず、それぞれが「まとめて回答中」になる。
 */
export function WaitCellGrid({
  question,
  cellAnswers,
  selectedCells,
  formatAnswer,
  onToggleCell,
  disabled = false,
}: WaitCellGridProps) {
  const t = useTranslations("machiScore.cells");
  const selectedKeys = new Set(selectedCells.map(cellKeyOf));

  // 縦に隣り合う選択中のマスの塊。先頭のキーに塊の全マスを持たせ、先頭以外は
  // absorbed に入れて td を描かない（rowSpan が行をまたぐ）
  const runs = new Map<string, readonly MachiCellRef[]>();
  const absorbed = new Set<string>();
  for (const isTsumo of [true, false]) {
    let run: MachiCellRef[] = [];
    const flush = () => {
      if (run.length >= 2) {
        runs.set(cellKeyOf(run[0]), run);
        for (const cell of run.slice(1)) absorbed.add(cellKeyOf(cell));
      }
      run = [];
    };
    for (const wait of question.waits) {
      const cell = { agariHai: wait.agariHai, isTsumo };
      if (selectedKeys.has(cellKeyOf(cell))) run.push(cell);
      else flush();
    }
    flush();
  }

  const buttonClasses = (isSelected: boolean, isAnswered: boolean) =>
    `press-sm flex h-full min-h-14 w-full items-center justify-center rounded-lg border-3 px-2 py-2 text-center text-sm font-bold leading-snug ${cellClasses(isSelected, isAnswered)}`;

  const renderCell = (cell: MachiCellRef) => {
    const key = cellKeyOf(cell);
    if (absorbed.has(key)) return null;

    const run = runs.get(key);
    if (run) {
      return (
        // td の h-px は、行をまたいだセルの高さいっぱいにボタンを伸ばすため
        // （table のセル内で h-full を効かせるには td 自身に高さが要る）
        <td key={key} rowSpan={run.length} className="h-px p-1 sm:p-1.5">
          <button
            type="button"
            disabled={disabled}
            aria-pressed
            onClick={() => {
              for (const member of run) onToggleCell(member);
            }}
            className={buttonClasses(true, false)}
          >
            {t("answeringTogether")}
          </button>
        </td>
      );
    }

    const answer = cellAnswers[key];
    const isSelected = selectedKeys.has(key);
    return (
      <td key={key} className="h-px p-1 sm:p-1.5">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={isSelected}
          onClick={() => onToggleCell(cell)}
          className={buttonClasses(isSelected, answer !== undefined)}
        >
          {answer
            ? formatAnswer(answer, cell.isTsumo)
            : isSelected
              ? t("answering")
              : t("unanswered")}
        </button>
      </td>
    );
  };

  const renderColumnHeader = (isTsumo: boolean) => (
    <th scope="col" className="px-1 pb-2 text-center align-bottom">
      <span className="text-sm font-bold text-surface-700">
        {t(isTsumo ? "tsumo" : "ron")}
      </span>
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
