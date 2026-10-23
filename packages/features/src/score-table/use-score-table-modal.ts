"use client";

import { useCallback, useState } from "react";

import type { ScoreTableFocus } from "./focus";

/** 点数表モーダルの開閉の状態 */
export interface ScoreTableModalState {
  /** モーダルが開いているか */
  readonly isOpen: boolean;
  /** 正解のセルをハイライトして開いたか */
  readonly highlighted: boolean;
  /**
   * モーダルを開く
   *
   * @param highlighted - 正解のセルをハイライトするか
   */
  readonly open: (highlighted: boolean) => void;
  /** モーダルを閉じる */
  readonly close: () => void;
}

/**
 * 答え合わせから開く点数表モーダルの開閉を持つフック
 * 点数表モーダル状態
 *
 * 値（点数・内訳の翻数と符）を押したときだけ正解のセルをハイライトし、
 * 表への補助リンク（「点数表を確認」）からは素の表を開く。この約束を
 * 答え合わせ・点数内訳パネルの web とモバイルで揃えるためにここに置く。
 * 開く側が `open(true)` / `open(false)` を選び、表の描画は各プラットフォームの
 * モーダルが `highlighted` を読んで決める。
 */
export function useScoreTableModal(): ScoreTableModalState {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const open = useCallback((nextHighlighted: boolean) => {
    setHighlighted(nextHighlighted);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, highlighted, open, close };
}

/** 点数内訳パネルから点数表を開く 2 つの操作。正解の位置が無ければどちらも無い */
export interface ScoreTableOpeners {
  /** 点数表を開く（「点数表を確認」は `false` で素の表を開く） */
  readonly openScoreTable: ((highlighted: boolean) => void) | undefined;
  /** 正解のセルをハイライトして開く。内訳の答えの値（翻数の合計・符）を押したとき */
  readonly openHighlighted: (() => void) | undefined;
}

/**
 * 点数内訳パネルが点数表を開けるかを、正解の位置（`scoreTableFocus`）の有無で決める
 * 点数表開閉操作
 *
 * 位置を渡されない画面では、内訳の値はただの文字で「点数表を確認」も出さない。
 * web とモバイルの `ScoreBreakdownPanel` が同じ約束で読む。
 *
 * @param focus - この問題の正解の位置。無ければ undefined
 * @param open - {@link ScoreTableModalState.open}
 */
export function scoreTableOpeners(
  focus: ScoreTableFocus | undefined,
  open: ScoreTableModalState["open"],
): ScoreTableOpeners {
  if (focus === undefined) {
    return { openScoreTable: undefined, openHighlighted: undefined };
  }
  return { openScoreTable: open, openHighlighted: () => open(true) };
}
