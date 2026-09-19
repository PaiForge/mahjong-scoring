"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { JudgementResult } from "@mahjong-scoring/core";
import { haiIdToMspz } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { JudgementMark } from "../../_components/judgement-mark";
import { cellKeyOf, type MachiCellRef } from "../_hooks/use-machi-score-store";

/**
 * タブの枠と地。正誤の色は待ち牌の判定・回答の段階のマスと同じ語彙で、
 * 判定が無い（「わからない」での開示）ときは中立。選択中はこれに
 * primary のリングを重ねる — 色を選択の印に使うと、緑の枠に赤い ✗ が
 * 乗るような「正誤と選択が別のことを言う」状態になる
 */
function tabTone(verdict: "correct" | "incorrect" | undefined): string {
  if (verdict === undefined) return "border-ink bg-white text-surface-700";
  return verdict === "correct"
    ? "border-success bg-success-subtle text-surface-900"
    : "border-destructive bg-destructive-subtle text-surface-900";
}

/** タブの id（内訳パネルの `aria-labelledby` から引く） */
export function cellTabId(cell: MachiCellRef): string {
  return `machi-score-result-tab-${cellKeyOf(cell)}`;
}

interface WaitCellTabsProps {
  /** タブに並べるマス（待ちの並びに、ツモ・ロンの順） */
  readonly cells: readonly MachiCellRef[];
  /** マスごとの判定。「わからない」での開示では undefined（印を出さない） */
  readonly cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  readonly focused: MachiCellRef;
  readonly onFocusCell: (cell: MachiCellRef) => void;
  /**
   * マスの正解を行に分けたもの（「3翻 40符」「5200点」、役なしは
   * 「役なし」の 1 行）。`formatCellAnswerLines` の形
   */
  readonly correctAnswerLinesOf: (cell: MachiCellRef) => readonly string[];
  /** 下に続く内訳パネルの id（`aria-controls`） */
  readonly panelId: string;
}

/**
 * 待ち × ツモ/ロン のマスを切り替えるタブ
 * 待ちマスタブ
 *
 * 選ぶ対象を出題盤面と同じ姿（和了牌 + ツモ / ロン）でタブに出し、タブ
 * ごとに正解の点数を添える。タブの列を左から読むだけで「待ちによって
 * 点数がどう変わるか」が並んで見える — この練習が見せたいのはそれで、
 * 外したときも「わからない」で開示したときも、正解が一列に読める場所が
 * ここしか無い（回答の段階の表に並ぶのは自分の回答で、正解ではない）。
 * 自分の回答と内訳（役・符）は選んだタブの下のパネルが持つ。タブに
 * 回答まで載せると下のパネルと同じ中身が二度出る。
 *
 * 以前はマスを表に並べて押させていたが、表のマスは正解のほかに外した
 * 回答も抱えて下のパネルと重複し、どの行を押したから今の内訳が出ている
 * のかも表と離れて分かりにくかった。
 *
 * 正解の点数は「翻・符」と「支払い」の 2 行に積む。1 行に並べると幅が
 * 点数の文字で決まり、2 面待ちの 4 タブでも狭い画面に収まらなかった
 * （実測で 1 タブ約 125〜140px）。2 行なら幅は支払いの文字ぶんで済む。
 *
 * 多面待ちではタブが 6 つ以上になるため、折り返さず横スクロールさせる
 * （折り返すと 2 段目が表に見えて、また「表のどこを押すか」に戻る）。
 * 外したマスはタブの ✗ で分かるので、全マスの正誤はタブの列を見れば済む。
 */
export function WaitCellTabs({
  cells,
  cellResults,
  focused,
  onFocusCell,
  correctAnswerLinesOf,
  panelId,
}: WaitCellTabsProps) {
  const t = useTranslations("machiScore");
  const tCommon = useTranslations("common");
  const tabRefs = useRef<(HTMLButtonElement | undefined)[]>([]);
  const focusedIndex = cells.findIndex(
    (cell) => cellKeyOf(cell) === cellKeyOf(focused),
  );

  // タブの作法どおり矢印キーで隣のタブへ移す（Tab キーは選択中の 1 つだけを
  // 拾い、タブ列全体を素通りできるようにする = roving tabindex）
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : undefined;
    const target =
      step !== undefined
        ? (focusedIndex + step + cells.length) % cells.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? cells.length - 1
            : undefined;
    if (target === undefined) return;
    event.preventDefault();
    onFocusCell(cells[target]);
    tabRefs.current[target]?.focus();
  };

  return (
    // リング（選択中の印）が切れないよう、横スクロールの箱に余白を持たせる
    <div
      role="tablist"
      aria-label={t("result.summaryTitle")}
      className="flex gap-2 overflow-x-auto p-1"
      onKeyDown={handleKeyDown}
    >
      {cells.map((cell, index) => {
        const key = cellKeyOf(cell);
        const isFocused = index === focusedIndex;
        const result = cellResults?.[key];
        const verdict = result
          ? result.isCorrect
            ? "correct"
            : "incorrect"
          : undefined;
        const correctLines = correctAnswerLinesOf(cell);
        return (
          <button
            key={key}
            id={cellTabId(cell)}
            ref={(element) => {
              tabRefs.current[index] = element ?? undefined;
            }}
            type="button"
            role="tab"
            aria-selected={isFocused}
            aria-controls={panelId}
            tabIndex={isFocused ? 0 : -1}
            // 牌の画像と記号で名乗るので、読み上げ用の名前はここでまとめる
            aria-label={[
              t(cell.isTsumo ? "cells.tsumo" : "cells.ron"),
              haiIdToMspz(cell.agariHai),
              ...correctLines,
              verdict && tCommon(verdict),
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onFocusCell(cell)}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg border-3 px-1.5 py-1 text-xs font-bold ${tabTone(
              verdict,
            )} ${isFocused ? "ring-2 ring-primary-500 ring-offset-2" : ""}`}
          >
            <span>{t(cell.isTsumo ? "cells.tsumo" : "cells.ron")}</span>
            <span className="flex items-center gap-0.5">
              <span className="origin-center scale-90">
                <Hai hai={cell.agariHai} size="sm" />
              </span>
              {verdict && (
                <JudgementMark verdict={verdict} className="text-base" />
              )}
            </span>
            {/* 正解の点数。行の中で折り返すとタブの高さが揃わず列が読めないので、
                行ごとに 1 行に固定する */}
            {correctLines.map((line) => (
              <span key={line} className="whitespace-nowrap">
                {line}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
