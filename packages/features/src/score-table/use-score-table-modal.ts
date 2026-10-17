"use client";

import { useCallback, useState } from "react";

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
