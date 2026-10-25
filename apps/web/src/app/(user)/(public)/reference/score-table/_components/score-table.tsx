"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { ToggleGroup } from "@/app/(user)/_components/toggle-group";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { useScoreTableOptions } from "@mahjong-scoring/features/score-table/use-score-table-options";
import { useScoreTableSelection } from "@mahjong-scoring/features/score-table/use-score-table-selection";
import {
  buildScoreGrid,
  type ScoreTableViewMode,
} from "@mahjong-scoring/features/score-table/score-grid";
import type { Role, WinType } from "@mahjong-scoring/core";
import { NormalScoreTable } from "./normal-score-table";
import { HighScoreTable } from "./high-score-table";
import { KiriageManganNote } from "./kiriage-mangan-note";

interface ScoreTableProps {
  /**
   * 注目させる和了。親子・ロンツモのタブ初期値と表示モードの初期値になり、
   * 該当セル（満貫以上なら区分行）をハイライトして初期表示時に
   * 画面中央へスクロールする。タブを focus と別の組へ切り替えている間、
   * ハイライトは表示しない。
   */
  readonly focus?: ScoreTableFocus;
  /** focus なしでタブ初期値だけ指定する場合の親/子 */
  readonly initialRole?: Role;
  /** focus なしでタブ初期値だけ指定する場合のロン/ツモ */
  readonly initialWinType?: WinType;
  /**
   * focus なしで開くときの表示モード（符×翻 / 満貫以上）。
   * 満貫以上の表を読む章から開くとき、同じ区分の表を最初から見せるために使う
   */
  readonly initialViewMode?: ScoreTableViewMode;
  /**
   * セルタップでのぼかし切り替え（暗記用）を有効にするか。
   * 答え合わせの参照用モーダルでは誤タップで数字が消えないよう無効にする。
   */
  readonly blurToggleEnabled?: boolean;
}

/**
 * 点数早見表のコンテナ
 * 点数早見表
 *
 * 親子・ツモロン・表示モードの切り替え状態（features の
 * `useScoreTableSelection`）と点数グリッドの計算を持ち、表本体の描画は
 * NormalScoreTable / HighScoreTable に委譲する。ページ（クエリパラメータ）
 * からもモーダル（練習の答え合わせ）からも使えるよう、注目対象は props の
 * focus で受け取る。focus が後から届いたらそのセルへスクロールする。
 */
export function ScoreTable({
  focus,
  initialRole = "ko",
  initialWinType = "ron",
  initialViewMode = "normal",
  blurToggleEnabled = true,
}: ScoreTableProps) {
  const t = useTranslations("scoreTable");
  const highlightRef = useRef<HTMLTableCellElement>(null);
  const {
    focusTarget,
    activeTab,
    setActiveTab,
    winType,
    setWinType,
    viewMode,
    setViewMode,
    isKo,
    isFocusView,
    hiddenCells,
    toggleCell,
  } = useScoreTableSelection({
    focus,
    initialRole,
    initialWinType,
    initialViewMode,
  });
  const { roleOptions, winTypeOptions, viewModeOptions } =
    useScoreTableOptions();

  // ルール設定は端末ローカル（localStorage）。サーバーと hydration 中は既定値で描いて
  // 表の数字を初期 HTML に載せたまま、hydration 後に設定値へ追随させる
  const isClient = useIsClient();
  const kiriageMangan =
    useRuleSettingsStore((s) => s.kiriageMangan) && isClient;

  /** 符・翻の点数計算結果グリッド（activeTab / winType / 切り上げ満貫設定に依存） */
  const scoreGrid = useMemo(
    () => buildScoreGrid(activeTab, winType, { kiriageMangan }),
    [activeTab, winType, kiriageMangan],
  );

  // 初期表示時と、focus が後から届いたときにハイライトへ寄せる
  useEffect(() => {
    if (highlightRef.current) {
      // 点数表は縦にも横にも広いので、縦横ともセルを中央へ寄せる
      // （モーダルやモバイルでは inline を指定しないとセルが画面外に残る）
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [focusTarget]);

  const onToggleCell = blurToggleEnabled ? toggleCell : undefined;

  return (
    <div className="w-full relative">
      {/* Controls */}
      <div className="sticky top-0 z-20 pb-3 mb-1">
        {/* 狭い画面では間隔も詰めて 1 行に収める。それでも足りなければ
            グループ単位で折り返す（ラベル内では改行させない） */}
        <div className="flex flex-wrap gap-1.5 items-center justify-end sm:gap-2">
          <ToggleGroup
            options={roleOptions}
            selected={activeTab}
            onChange={setActiveTab}
          />
          <ToggleGroup
            options={winTypeOptions}
            selected={winType}
            onChange={setWinType}
          />
          <ToggleGroup
            options={viewModeOptions}
            selected={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      {/* ツモの2段表示（子は上下、親はオール）の読み方を表の直前で補う */}
      {winType === "tsumo" && (
        <p className="mb-2 text-xs text-surface-500">
          {isKo ? t("tsumoNote.ko") : t("tsumoNote.oya")}
        </p>
      )}

      {/* Table（横に溢れたぶんは DataTable が自分の枠の中でスクロールする） */}
      <div className="w-full">
        {viewMode === "normal" ? (
          <NormalScoreTable
            scoreGrid={scoreGrid}
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            highlight={isFocusView ? focusTarget.normalCell : undefined}
            highlightRef={highlightRef}
            onToggleCell={onToggleCell}
          />
        ) : (
          <HighScoreTable
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            highlightKey={isFocusView ? focusTarget.highScoreKey : undefined}
            highlightRef={highlightRef}
            onToggleCell={onToggleCell}
          />
        )}
      </div>

      {/* 切り上げ満貫が動かすのは符×翻の表だけなので、満貫+ の表では出さない */}
      {viewMode === "normal" && (
        <div className="mt-2">
          <KiriageManganNote enabled={kiriageMangan} />
        </div>
      )}
    </div>
  );
}
