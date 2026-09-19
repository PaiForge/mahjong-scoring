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
 * タブの地と文字色
 *
 * 選択中のタブは下のパネルと同じ白にして地続きに見せる（枠はどのタブも
 * パネルと同じ墨色。色を選択の印に使うと、緑の枠に赤い ✗ が乗るような
 * 「正誤と選択が別のことを言う」状態になる）。選択していないタブは
 * 正誤の色で薄く塗る — 待ち牌の判定・回答の段階のマスと同じ語彙で、
 * 判定が無い（「わからない」での開示）ときは中立の灰。選択中のタブは
 * 塗りを失うが、正誤は ✓/✗ の記号が持っているので読める。
 */
function tabTone(
  verdict: "correct" | "incorrect" | undefined,
  isSelected: boolean,
): string {
  if (isSelected) return "bg-white text-surface-900";
  if (verdict === undefined) return "bg-surface-50 text-surface-600";
  return verdict === "correct"
    ? "bg-success-subtle text-surface-800"
    : "bg-destructive-subtle text-surface-800";
}

/** パネルの上枠の太さ（`border-3`）。選択中のタブがこの分だけ下へ伸びて枠を覆う */
const PANEL_BORDER_PX = 3;

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
 * タブの正解はパネルの「正解」列と重なって見えるが、重なるのは選んで
 * いるタブ 1 つだけで、他のタブの正解はタブにしか出ていない。タブから
 * 点数を外すと、待ちをまたいで点数を見比べるにはタブを 1 つずつ押して
 * 回るしかなくなる。全問正解なら回答の段階の表で見比べは済んでいるが、
 * 外したときと開示したときにこそ見比べが要るので、重なりを承知で載せる。
 *
 * 以前はマスを表に並べて押させていたが、表のマスは正解のほかに外した
 * 回答も抱えて下のパネルと重複し、どの行を押したから今の内訳が出ている
 * のかも表と離れて分かりにくかった。
 *
 * 見た目はブラウザのタブに寄せる。タブは上だけ角丸で下枠を持たず、
 * パネルの上枠に乗る。選択中のタブはパネルと同じ白で、パネルの上枠の
 * 太さぶん下へ伸びて枠を覆い、タブとパネルが 1 枚につながって見える —
 * 「今どのタブの内訳を見ているか」を、枠のつながりだけで言うため。
 * 離れた列とパネルにリング（選択の印）を付ける形では、どのタブの中身が
 * 下に出ているのかが一目で結びつかなかった。はみ出す 3px は横スクロールの
 * 箱の下余白に収め、箱を同じ分だけ負のマージンでパネルに重ねる（箱の
 * 外にはみ出すと overflow で切れる）。
 *
 * 正解の点数は「翻・符」と「支払い」の 2 行に積む。1 行に並べると幅が
 * 点数の文字で決まり、2 面待ちの 4 タブでも狭い画面に収まらなかった
 * （実測で 1 タブ約 125〜140px）。2 行なら幅は支払いの文字ぶんで済む。
 * 役なしのマスは「役なし」の 1 行だけだが、タブの高さは列で揃える
 * （flex の stretch）。1 つだけ低いタブが混ざると上端が凹んで見える。
 * 「役なし」は翻・符の行の位置に出る — 役なしは翻数が無いという主張
 * なので、結果表が「役なし」を翻数の行に置くのと揃える。
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
  const overlap = `${PANEL_BORDER_PX}px`;
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
    // 下余白 = パネルの上枠の太さ。選択中のタブはここへはみ出してパネルの
    // 枠を覆う。箱自体は同じ分だけ負のマージンでパネルに重ね、z-index で
    // パネルより手前に描く
    <div
      role="tablist"
      aria-label={t("result.summaryTitle")}
      className="relative z-10 flex items-stretch gap-1 overflow-x-auto"
      style={{ paddingBottom: overlap, marginBottom: `-${overlap}` }}
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
            // 選択中のタブは負のマージンぶん下へ伸びてパネルの上枠を覆う
            // （高さは stretch で他のタブに揃うので上端は動かない）。
            // フォーカスのリングは箱の overflow で切れないよう内側に引く
            style={isFocused ? { marginBottom: `-${overlap}` } : undefined}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-t-lg border-3 border-b-0 border-ink px-2 pb-1.5 pt-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${tabTone(
              verdict,
              isFocused,
            )}`}
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
