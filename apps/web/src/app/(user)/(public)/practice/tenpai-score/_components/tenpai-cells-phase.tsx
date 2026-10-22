"use client";

import { useTranslations } from "next-intl";
import type {
  MachiCellAnswer,
  TenpaiScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";
import type { MachiCellRef } from "@mahjong-scoring/features/practice/tenpai-score/cell-ref";
import {
  CELL_COLUMNS,
  resolveCellsPhaseView,
  type CellColumn,
} from "@mahjong-scoring/features/practice/tenpai-score/cells-phase";
import type { ScorePracticeModeFlags } from "@mahjong-scoring/features/practice/score/generator-options";
import { Button } from "@/app/(user)/_components/button";
import { QuestionPrompt } from "../../_components/question-prompt";
import { scrollToPracticeAnchor } from "../../_lib/scroll-anchor";
import { ScorePracticeAnswerForm } from "../../agari-score/_components/score-practice-answer-form";
import { TENPAI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import { TenpaiScoreSpotlightTour } from "./tenpai-score-spotlight-tour";
import { WaitCellGrid } from "./wait-cell-grid";

/**
 * 待ち × ツモ/ロン のマスに点数を当てはめる段階（`cells`）
 * マス回答の段階
 *
 * 当てはめると表の塊が組み変わり、最後の 1 つなら選択が解けて回答欄も
 * 消え、下にあった「回答する」が欄の高さぶん上へ跳ぶ。押した位置に留まる
 * と表もボタンも画面外になるので、他の切り替え操作と同じく盤面の先頭へ
 * 戻す（当てはめた結果の塊と、続けて回答中になったマスが表の中に見える）。
 */
export function TenpaiCellsPhase({
  question,
  cellAnswers,
  selectedCells,
  questionSeq,
  draftSeq,
  modeFlags,
  isOya,
  formatAnswer,
  onToggleCell,
  onAssign,
  onSubmit,
}: {
  readonly question: TenpaiScoreQuestion;
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  readonly selectedCells: readonly MachiCellRef[];
  /** 出題ごとに増える連番（回答欄の key） */
  readonly questionSeq: number;
  /** 列ごとの回答欄を作り直す連番（当てはめた列だけ増える） */
  readonly draftSeq: Readonly<Record<CellColumn, number>>;
  readonly modeFlags: ScorePracticeModeFlags;
  readonly isOya: boolean;
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  readonly onToggleCell: (cell: MachiCellRef) => void;
  readonly onAssign: (answer: MachiCellAnswer) => void;
  readonly onSubmit: () => void;
}) {
  const t = useTranslations("tenpaiScore");
  const { requireYaku, requireHanFu, exactHan, requireFuForMangan } = modeFlags;
  const { remaining, selectedIsTsumo, isSelecting, prefill } =
    resolveCellsPhaseView(question, selectedCells, cellAnswers);

  const handleAssignScore = (answer: UserAnswer) => {
    scrollToPracticeAnchor();
    onAssign({ kind: "score", answer });
  };
  const handleAssignNoYaku = () => {
    scrollToPracticeAnchor();
    onAssign({ kind: "noYaku" });
  };
  const handleSubmit = () => {
    scrollToPracticeAnchor();
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-1.5">
        <QuestionPrompt>{t("cells.prompt")}</QuestionPrompt>
        <TenpaiScoreSpotlightTour requireHanFu={requireHanFu} />
      </div>

      <WaitCellGrid
        question={question}
        cellAnswers={cellAnswers}
        selectedCells={selectedCells}
        formatAnswer={formatAnswer}
        onToggleCell={onToggleCell}
      />

      {/* 回答欄はマスを選んだときだけ見せる。選ぶ前から無効の欄を置くと
          「押すと欄が出る」という因果が見えず、何を選べば答えられるのか
          が伝わらない。選んだマスは表の色（琥珀）と塊で分かるので、
          「選択中: n マス」の見出しは持たない。ヘルプツアーは選択が無い間
          この欄を飛ばす（data-tour-id は見えている欄にだけ付ける）。
          欄は列（ツモ / ロン）ごとに 1 つずつ、1 問の間ずっと mount した
          まま hidden で出し入れする — 回答の形（支払いの形・役なしの
          有無）が列で違うため欄は分けるが、入力は当てはめるまでどの
          マスにも入っていないので、選択を解いた・別の列を押したの拍子に
          欄を作り直すと誤タップ 1 回で入力が失われる。作り直すのは
          当てはめて回答がマスに移ったとき（draftSeq）と次の問題
          （questionSeq）だけ。
          回答済みのマスを選択に加えると、その回答を欄に読み込む
          （prefill）。まとめて答えた 2 マスに 3 つめを後から合流させる
          とき、塊を押す → 当てはめる の 2 タップで済み、同じ翻・符・
          点数を入れ直さない。塊は回答の同一性で作られるので、合流した
          3 マスは当てはめた瞬間に 1 枚になる。読み込むのは欄が未入力の
          間だけで、入力の途中で回答済みのマスを押しても入力は守られる
          （欄が判定する） */}
      {CELL_COLUMNS.map((column) => {
        const isTsumo = column === "tsumo";
        const isShown = selectedIsTsumo === isTsumo;
        return (
          <div
            key={column}
            hidden={!isShown}
            className="rounded-lg bg-surface-50 p-4"
            data-tour-id={isShown ? TENPAI_SCORE_TOUR_ID.answerForm : undefined}
          >
            <ScorePracticeAnswerForm
              key={`${questionSeq}:${draftSeq[column]}`}
              onSubmit={handleAssignScore}
              isTsumo={isTsumo}
              isOya={isOya}
              requireYaku={requireYaku}
              requireHanFu={requireHanFu}
              exactHan={exactHan}
              requireFuForMangan={requireFuForMangan}
              submitLabel={t("cells.assign")}
              prefill={isShown ? prefill : undefined}
              // 「役なし」はロンにしか無い回答なので、ロンの欄にだけ出す。
              // 置き場の「役」の行は常に出し、ツモとロンで高さを変えない
              reserveYakuRow
              noYaku={
                isTsumo
                  ? undefined
                  : {
                      label: t("cells.noYaku"),
                      onSelect: handleAssignNoYaku,
                    }
              }
            />
          </div>
        );
      })}

      {/* 「回答する」はマスを選んでいる間（回答中）も押させない。
          回答中は入力の途中で、押せると入力を捨てて古い回答で答え合わせに
          進んでしまう。何をすれば押せるかを注記で言う。未回答が残る限り
          その数を出す — 当てはめると次の未回答のマスが続けて回答中になる
          ため、残数と選択中は常に重なる。あと何マスかの方が先に要る情報
          で、「当てはめるか解く」は全マス埋めた後に押せない理由を説明する
          ためだけに要る */}
      <div className="space-y-2">
        {(isSelecting || remaining > 0) && (
          <p className="text-center text-xs text-surface-500">
            {remaining > 0
              ? t("cells.remaining", { count: remaining })
              : t("cells.selecting")}
          </p>
        )}
        <div data-tour-id={TENPAI_SCORE_TOUR_ID.cellsSubmit}>
          <Button
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={remaining > 0 || isSelecting}
          >
            {t("cells.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
