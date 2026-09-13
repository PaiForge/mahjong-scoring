"use client";

import { useTranslations } from "next-intl";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { haiIdToMspz } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { cellKeyOf, type MachiCellRef } from "../_hooks/use-machi-score-store";
import { answerKey, groupAdjacentCells, indexRuns } from "../_lib/cell-runs";
import type { CellRun } from "../_lib/cell-runs";
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

/** マスの状態（描画の見た目とラベルを決める） */
type CellState =
  /** 回答済み。緑で塗る（決めた面） */
  | "answered"
  /**
   * 回答中（選択中）。琥珀で塗る（今触っている面）。回答済みのマスを
   * 選び直したときもこれで、回答の文字はそのまま残す（当てはめるまで
   * 何も変わっていないことを見せる）
   */
  | "answering"
  /** 未回答で、選択中のマスと同じ列。押すと選択に加わり同じ回答になる */
  | "joinable"
  /** 未回答 */
  | "unanswered";

/**
 * マスの枠と背景
 *
 * 回答済みが緑（決めた面）、回答中が琥珀（今触っている面）。答えを入れる
 * 前の状態を緑にすると「済んだ」ように見えるため、進行中の色は
 * HighlightPanel と同じ琥珀に寄せる。同じ列の未回答は琥珀の破線で
 * 「回答中に加われる」ことを示し、他の列の未回答は灰の破線のまま。
 */
const CELL_CLASSES: Readonly<Record<CellState, string>> = {
  answered: "border-primary-500 bg-primary-50 text-surface-900",
  answering: "border-amber-500 bg-amber-50 text-surface-900",
  joinable: "border-dashed border-amber-400 bg-amber-50/40 text-surface-700",
  unanswered: "border-dashed border-surface-300 bg-surface-50 text-surface-400",
};

/**
 * 塊のグループ
 *
 * - `answering`: 選択中のマス。見た目は 1 枚だが行ごとに押せて、押した行
 *   だけ選択から外れる
 * - `answered:<回答キー>`: 未選択で回答が同じマス。1 つのボタンで、押すと
 *   塊ごと選択に入る
 */
type RunGroup = "answering" | `answered:${string}`;

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
 * 選択中のマスは「回答中」。同じ列の未回答のマスは「同じ回答にする」に
 * 変わり、押すと選択に加わる — 「未回答」のままだと、両方を押さなければ
 * まとめられることに気づけない。同じ列で縦に隣り合う選択中のマスは
 * `rowSpan` で 1 つのマスにつなげ「まとめて回答中」を 1 つだけ出す —
 * 割れていたものが押した瞬間に 1 枚になることで、これらが同じ答えになる
 * （1 回の入力で済む）と見た目で伝える。文言だけだと読み飛ばされる。
 * 間を空けて選んだ（真ん中を跨ぐ）場合はつながらず、それぞれが塊になる。
 *
 * 当てはめた後も、縦に隣り合っていて回答が同じマスは 1 つの塊にして
 * 回答の文字を 1 回だけ出す。当てはめた瞬間に 1 枚だったものが 2 枚に
 * 割れると「まとめて答えた」実感と食い違うし、同じ文字を並べても
 * 「この待ちは同じ点数」以上のことは言わない。判定は「まとめて当てはめた
 * 記録」ではなく回答の同一性 — 別々に答えて同じになったものも意味は同じ
 * で、記録を持たずに済む。塊を押すと塊ごと選択に入り、当てはめ直すと
 * 全部に効く（まとめて答えたものはまとめて直したい）。
 *
 * 一方で「まとめて答えたが実は 1 つだけ違った」を直す道が要る（待ちごとに
 * 点数が違うのがこの練習の肝）。選択中の塊は見た目こそ 1 枚だが行ごとに
 * 押せて、押した行だけ選択から外れる — 他の行を外して当てはめれば、その
 * 1 つだけ変わって塊が割れる。引き換えに「塊を押すと全部解ける」は無く、
 * 全部解くには行ごとに押すか、他の列を押して選択を移す。全部解く場面は
 * 当てはめるより少ない。答え合わせは別々に ✓/✗ が付くため、塊は回答中の
 * 姿にとどめる。
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
  // 選択中のマスは同じ列に限られる（ストアが保証する）ので先頭で列が決まる
  const selectedIsTsumo = selectedCells[0]?.isTsumo;

  // 縦に隣り合う塊。先頭のキーに塊を持たせ、先頭以外は absorbed に入れて
  // td を描かない（rowSpan が行をまたぐ）。塊になる条件は「どちらも選択中」
  // か「どちらも未選択の回答済みで回答が同じ」。1 マスだけのものは塊と
  // して扱わず、単体のマスとして描く
  const { runAt: runs, absorbed } = indexRuns(
    groupAdjacentCells<RunGroup>(question, (cell) => {
      const key = cellKeyOf(cell);
      const answer = cellAnswers[key];
      return selectedKeys.has(key)
        ? "answering"
        : answer
          ? `answered:${answerKey(answer)}`
          : undefined;
    }).filter((run) => run.cells.length >= 2),
  );

  const buttonClasses = (state: CellState) =>
    `press-sm flex h-full min-h-14 w-full items-center justify-center rounded-lg border-3 px-2 py-2 text-center text-sm font-bold leading-snug ${CELL_CLASSES[state]}`;

  /** 塊の文字。全マスの回答が同じならその回答、そうでなければ「まとめて回答中」 */
  const runLabel = (run: CellRun<RunGroup>) => {
    const [first] = run.cells;
    const answer = cellAnswers[cellKeyOf(first)];
    if (!answer) return t("answeringTogether");
    const key = answerKey(answer);
    const allSame = run.cells.every((cell) => {
      const other = cellAnswers[cellKeyOf(cell)];
      return other !== undefined && answerKey(other) === key;
    });
    return allSame
      ? formatAnswer(answer, first.isTsumo)
      : t("answeringTogether");
  };

  const renderRun = (key: string, run: CellRun<RunGroup>) => {
    const label = runLabel(run);
    if (run.group !== "answering") {
      return (
        // td の h-px は、行をまたいだセルの高さいっぱいにボタンを伸ばすため
        // （table のセル内で h-full を効かせるには td 自身に高さが要る）
        <td key={key} rowSpan={run.cells.length} className="h-px p-1 sm:p-1.5">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={false}
            onClick={() => {
              for (const member of run.cells) onToggleCell(member);
            }}
            className={buttonClasses("answered")}
          >
            {label}
          </button>
        </td>
      );
    }
    return (
      <td key={key} rowSpan={run.cells.length} className="h-px p-1 sm:p-1.5">
        {/* 見た目は 1 枚のマス、押す単位は行。枠と文字は外側の div が持ち、
            行ごとの button は透明で積む（文字は読み上げから外し、行の
            button が「何を外すか」を名乗る）。押し込みの演出は外側に付ける
            （:hover / :active は押した行の祖先にも当たる） */}
        <div
          role="group"
          aria-label={label}
          className={`relative flex h-full min-h-14 w-full flex-col overflow-hidden rounded-lg border-3 ${CELL_CLASSES.answering} ${disabled ? "" : "press-sm"}`}
        >
          {run.cells.map((member, i) => (
            <button
              key={cellKeyOf(member)}
              type="button"
              disabled={disabled}
              aria-pressed
              aria-label={t("removeFromSelection", {
                hai: haiIdToMspz(member.agariHai),
              })}
              onClick={() => onToggleCell(member)}
              className={`min-h-14 w-full flex-1 ${i > 0 ? "border-t-2 border-dashed border-amber-300" : ""}`}
            />
          ))}
          {/* 文字の背後だけ塗って、行の区切り線が文字を横切らないようにする */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center text-sm font-bold leading-snug"
          >
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5">
              {label}
            </span>
          </span>
        </div>
      </td>
    );
  };

  const renderCell = (cell: MachiCellRef) => {
    const key = cellKeyOf(cell);
    if (absorbed.has(key)) return null;

    const run = runs.get(key);
    if (run) return renderRun(key, run);

    const answer = cellAnswers[key];
    const isSelected = selectedKeys.has(key);
    const state: CellState = isSelected
      ? "answering"
      : answer
        ? "answered"
        : selectedIsTsumo === cell.isTsumo
          ? "joinable"
          : "unanswered";
    return (
      <td key={key} className="h-px p-1 sm:p-1.5">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={isSelected}
          onClick={() => onToggleCell(cell)}
          className={buttonClasses(state)}
        >
          {answer ? formatAnswer(answer, cell.isTsumo) : t(state)}
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
