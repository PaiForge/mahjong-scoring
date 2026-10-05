import { createContext, useContext, useEffect, type ReactNode } from "react";

/**
 * トレーニングの答え合わせの状態
 * トレーニング状態
 *
 * web の `use-training-mode.tsx` と同じ契約。盤面はチャレンジとトレーニングで
 * 共有するため、トレーニングだけの状態（正解を開示したか・回答後に止まって
 * いるか）は Context で届ける。チャレンジでは Provider が無く、両方 false。
 */
export interface TrainingModeState {
  /** 「わからない」で正解を開示したか */
  readonly isRevealed: boolean;
  /** 回答後に止まって答え合わせを読ませているか */
  readonly isHolding: boolean;
}

interface TrainingModeValue extends TrainingModeState {
  readonly registerAdvance: (advance: (() => void) | undefined) => void;
}

const TrainingModeContext = createContext<TrainingModeValue | undefined>(
  undefined,
);

const CHALLENGE_STATE: TrainingModeState = {
  isRevealed: false,
  isHolding: false,
};

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

/** トレーニングの答え合わせの状態（チャレンジでは常に false） */
export function useTrainingMode(): TrainingModeState {
  return useContext(TrainingModeContext) ?? CHALLENGE_STATE;
}

/**
 * 答え合わせで何を見せるか
 * 答え合わせ表示
 *
 * 内訳は回答後・開示後に出し、正解は間違えたとき（と開示したとき）だけ出す。
 */
export function useTrainingAnswerVisibility(
  lastAnswerCorrect: boolean | undefined,
): { readonly showAnswer: boolean; readonly showBreakdown: boolean } {
  const { isRevealed, isHolding } = useTrainingMode();
  const showBreakdown = isRevealed || isHolding;
  return {
    showAnswer: showBreakdown && lastAnswerCorrect !== true,
    showBreakdown,
  };
}

/**
 * 「わからない」で次の問題へ進む処理をシェルへ届ける
 * 次問題登録
 *
 * 盤面だけが次の問題の作り方を知っているので、盤面が登録し、シェルの
 * 「わからない」ボタンがそれを呼ぶ。チャレンジでは何もしない。
 */
export function useRegisterAdvance(advance: (() => void) | undefined): void {
  const registerAdvance = useContext(TrainingModeContext)?.registerAdvance;
  useEffect(() => {
    if (registerAdvance === undefined) return;
    registerAdvance(advance);
    return () => registerAdvance(undefined);
  }, [registerAdvance, advance]);
}
