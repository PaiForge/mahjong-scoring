"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

/**
 * トレーニングの停止状態
 * トレーニング停止状態
 *
 * 「答え合わせのために止まっている」2つの状態。どちらも盤面は正解表示を描き、
 * ユーザーが「次の問題へ」を押すまで次の問題に変わらない。
 * チャレンジ（時間制限あり）では両方 false になる。
 */
export interface TrainingModeState {
  /** 無回答のまま正解を開示中か（「わからない」） */
  readonly isRevealed: boolean;
  /** 回答後の停止中か */
  readonly isHolding: boolean;
}

interface TrainingModeValue extends TrainingModeState {
  /**
   * 次問題へ進む操作を登録する
   *
   * 出題の生成待ちなど、まだ進めない間は undefined を登録すること
   * （シェルの「わからない」が無効化される）。
   */
  readonly registerAdvance: (advance: (() => void) | undefined) => void;
}

const TrainingModeContext = createContext<TrainingModeValue | undefined>(
  undefined,
);

const CHALLENGE_STATE: TrainingModeState = {
  isRevealed: false,
  isHolding: false,
};

/**
 * 盤面をトレーニングの停止状態につなぐ提供元
 * トレーニングモードコンテキスト
 *
 * トレーニングのビューだけが提供する。チャレンジには無いため、同じ盤面を
 * チャレンジで描いたときは {@link useTrainingMode} が常に false を返し、
 * {@link useRegisterAdvance} は何もしない。
 */
export function TrainingModeProvider({
  value,
  children,
}: {
  readonly value: TrainingModeValue;
  readonly children: ReactNode;
}) {
  return (
    <TrainingModeContext.Provider value={value}>
      {children}
    </TrainingModeContext.Provider>
  );
}

/**
 * トレーニングの停止状態を読む
 * トレーニング停止状態参照
 *
 * 盤面・回答フォームが「正解を出すか」「回答ボタンを引っ込めるか」を
 * 決めるのに使う。チャレンジでは常に両方 false。
 */
export function useTrainingMode(): TrainingModeState {
  return useContext(TrainingModeContext) ?? CHALLENGE_STATE;
}

/**
 * 次問題へ進む操作をシェルへ登録する
 * 次問題操作の登録
 *
 * 「わからない」リンクと「次の問題へ」ボタンはシェルにあるが、次問題へ進む
 * 操作（出題の差し替えと入力欄のリセット）は盤面が持つ。盤面の状態をビューへ
 * 引き上げると盤面ごとに props の形が変わるため、逆に操作をシェルへ
 * 登録して受け渡す。
 *
 * @param advance 次問題へ進む操作。出題の生成待ちなど進めない間は undefined
 */
export function useRegisterAdvance(advance: (() => void) | undefined): void {
  const registerAdvance = useContext(TrainingModeContext)?.registerAdvance;

  useEffect(() => {
    if (registerAdvance === undefined) return;
    registerAdvance(advance);
    return () => registerAdvance(undefined);
  }, [registerAdvance, advance]);
}
