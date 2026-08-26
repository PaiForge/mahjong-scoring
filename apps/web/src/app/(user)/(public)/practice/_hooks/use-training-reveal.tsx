"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

interface TrainingRevealValue {
  /** 正解開示中かどうか */
  readonly isRevealed: boolean;
  /**
   * 次問題へ進む操作を登録する
   *
   * 出題の生成待ちなど、まだ進めない間は undefined を登録すること
   * （シェルの「わからない」が無効化される）。
   */
  readonly registerAdvance: (advance: (() => void) | undefined) => void;
}

const TrainingRevealContext = createContext<TrainingRevealValue | undefined>(
  undefined,
);

/**
 * 盤面を「わからない」（正解開示）の配線につなぐ提供元
 * 正解開示コンテキスト
 *
 * トレーニングのビューだけが提供する。チャレンジには無いため、同じ盤面を
 * チャレンジで描いたときは {@link useTrainingReveal} が何もしない。
 */
export function TrainingRevealProvider({
  value,
  children,
}: {
  readonly value: TrainingRevealValue;
  readonly children: ReactNode;
}) {
  return (
    <TrainingRevealContext.Provider value={value}>
      {children}
    </TrainingRevealContext.Provider>
  );
}

/**
 * 盤面から「わからない」（正解開示）の配線に参加する
 * 正解開示配線
 *
 * 「わからない」リンクはシェルのフッターにあるが、次問題へ進む操作
 * （出題の差し替えと入力欄のリセット）は盤面が持つ。盤面の状態をビューへ
 * 引き上げると盤面ごとに props の形が変わるため、逆に操作をシェルへ
 * 登録して受け渡す。
 *
 * @param advance 次問題へ進む操作。出題の生成待ちなど進めない間は undefined
 * @returns 正解開示中かどうか（チャレンジでは常に false）
 */
export function useTrainingReveal(advance: (() => void) | undefined): boolean {
  const context = useContext(TrainingRevealContext);
  const registerAdvance = context?.registerAdvance;

  useEffect(() => {
    if (registerAdvance === undefined) return;
    registerAdvance(advance);
    return () => registerAdvance(undefined);
  }, [registerAdvance, advance]);

  return context?.isRevealed ?? false;
}
