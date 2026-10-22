"use client";

import { useCallback, useMemo, useState } from "react";
import type { Role, WinType } from "@mahjong-scoring/core";
import {
  resolveScoreTableFocus,
  type ScoreTableFocus,
  type ScoreTableFocusTarget,
} from "./focus";
import type { ScoreTableViewMode } from "./score-grid";

/** 点数早見表の初期状態（props から来る） */
export interface ScoreTableSelectionInput {
  /** 注目させる和了。親子・ロンツモ・表示モードの初期値になる */
  readonly focus: ScoreTableFocus | undefined;
  /** focus なしで開くときの親/子 */
  readonly initialRole: Role;
  /** focus なしで開くときのロン/ツモ */
  readonly initialWinType: WinType;
  /** focus なしで開くときの表示モード（符×翻 / 満貫以上） */
  readonly initialViewMode: ScoreTableViewMode;
}

/**
 * 点数早見表の切り替えの状態
 * 点数早見表の選択状態
 */
export interface ScoreTableSelection {
  /** focus が指すセル・区分行と表示モード */
  readonly focusTarget: ScoreTableFocusTarget;
  readonly activeTab: Role;
  readonly setActiveTab: (role: Role) => void;
  readonly winType: WinType;
  readonly setWinType: (winType: WinType) => void;
  readonly viewMode: ScoreTableViewMode;
  readonly setViewMode: (viewMode: ScoreTableViewMode) => void;
  readonly isKo: boolean;
  /**
   * focus と同じ親子・ロンツモの表を見ているか。ハイライトはこのときだけ出す
   * （タブを切り替えた表では focus のセルは「その和了の点数」ではないため）
   */
  readonly isFocusView: boolean;
  /** 暗記用に数字を隠したセル（キーはセルの id） */
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  readonly toggleCell: (id: string) => void;
}

/** focus を値で比べる（undefined 同士は同じ） */
function sameFocus(
  a: ScoreTableFocus | undefined,
  b: ScoreTableFocus | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b;
  return (
    a.role === b.role &&
    a.winType === b.winType &&
    a.han === b.han &&
    a.fu === b.fu
  );
}

/**
 * 点数早見表の親子・ツモロン・表示モードの切り替えと、暗記用のセルの隠し
 * 点数早見表の選択状態フック
 *
 * web とアプリの `ScoreTable` が共有する。focus / 初期タブは後から届いてもよい
 * （web のページは静的生成で、URL のクエリは hydration 後にしか読めない）。
 * 届いたらタブ・表示モードを合わせ直す。レンダー中の setState は「props の
 * 変化に state を合わせる」React の定石（effect で行うと変更前の表が
 * 1 フレーム見える）。同じ内容の focus が別オブジェクトで来ても reset
 * しないよう値で比べる。
 */
export function useScoreTableSelection(
  input: ScoreTableSelectionInput,
): ScoreTableSelection {
  const { focus, initialRole, initialWinType, initialViewMode } = input;
  const focusTarget = useMemo(() => resolveScoreTableFocus(focus), [focus]);
  const resolvedViewMode =
    focus === undefined ? initialViewMode : focusTarget.viewMode;

  const [activeTab, setActiveTab] = useState<Role>(focus?.role ?? initialRole);
  const [winType, setWinType] = useState<WinType>(
    focus?.winType ?? initialWinType,
  );
  const [viewMode, setViewMode] =
    useState<ScoreTableViewMode>(resolvedViewMode);
  const [hiddenCells, setHiddenCells] = useState<Record<string, boolean>>({});

  const [applied, setApplied] = useState(input);
  if (
    !sameFocus(applied.focus, focus) ||
    applied.initialRole !== initialRole ||
    applied.initialWinType !== initialWinType ||
    applied.initialViewMode !== initialViewMode
  ) {
    setApplied(input);
    setActiveTab(focus?.role ?? initialRole);
    setWinType(focus?.winType ?? initialWinType);
    setViewMode(resolvedViewMode);
  }

  const toggleCell = useCallback((id: string) => {
    setHiddenCells((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    focusTarget,
    activeTab,
    setActiveTab,
    winType,
    setWinType,
    viewMode,
    setViewMode,
    isKo: activeTab === "ko",
    isFocusView:
      focus !== undefined &&
      activeTab === focus.role &&
      winType === focus.winType,
    hiddenCells,
    toggleCell,
  };
}
