"use client";

import { useCallback, useMemo, useState } from "react";
import type { TrainingSessionState } from "../session/use-training-session";
import type { TrainingModeValue } from "./use-training-mode";

interface TrainingModeBridge {
  /** 盤面へ渡すトレーニングの状態（`TrainingModeProvider` の value） */
  readonly trainingMode: TrainingModeValue;
  /** 「わからない」— 盤面が登録した「次の問題へ」で正解を開示する */
  readonly reveal: () => void;
  /**
   * 「わからない」を押せないか。答え合わせの表示中と、盤面が「次の問題へ」を
   * まだ登録していない間（出題の生成待ち）は押せない
   */
  readonly revealDisabled: boolean;
}

/**
 * トレーニングのセッションと盤面をつなぐ
 * トレーニング配線
 *
 * 「わからない」リンクと「次の問題へ」ボタンはシェルにあるが、次の問題へ
 * 進む操作（出題の差し替えと入力欄のリセット）は盤面が持つ。盤面がそれを
 * `useRegisterAdvance` で登録し、シェルはここで受け取った操作で開示する。
 * トレーニングのビュー（練習・模試・点数表早引き）が共通で使う。
 */
export function useTrainingModeBridge(
  session: Pick<
    TrainingSessionState,
    "isRevealed" | "isHolding" | "showFeedback" | "reveal"
  >,
): TrainingModeBridge {
  const { isRevealed, isHolding, showFeedback, reveal: revealWith } = session;
  const [advance, setAdvance] = useState<(() => void) | undefined>(undefined);
  const registerAdvance = useCallback(
    (next: (() => void) | undefined) => setAdvance(() => next),
    [],
  );
  const trainingMode = useMemo(
    () => ({ isRevealed, isHolding, registerAdvance }),
    [isRevealed, isHolding, registerAdvance],
  );
  const reveal = useCallback(() => {
    if (advance) revealWith(advance);
  }, [advance, revealWith]);

  return {
    trainingMode,
    reveal,
    revealDisabled: showFeedback || advance === undefined,
  };
}
