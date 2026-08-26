"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { scrollToPracticeAnchor } from "../_lib/scroll-anchor";

interface UseTrainingSessionOptions {
  /** 正誤フィードバックの表示時間（ms） */
  feedbackDurationMs?: number;
  /**
   * 回答後は自動で次問題へ進まず、{@link TrainingSessionState.proceed} の
   * 呼び出しを待つ
   *
   * 正解表示を突き合わせて読ませたい練習向け。正解・不正解のどちらでも止まる。
   * 正解でも止めるのは、合っていた根拠（符の内訳や符目ごとの正解）を確認する
   * 時間がトレーニングでは要るため。
   */
  holdAfterAnswer?: boolean;
}

/**
 * トレーニングセッション状態
 *
 * チャレンジ（{@link useTimedSession}）と異なり、制限時間・ミス上限・カウントダウンを持たない。
 * 終了はユーザーが明示的に離脱するまで発生せず、スコアも保存しない（リーダーボード非記録）。
 */
export interface TrainingSessionState {
  readonly correctCount: number;
  readonly totalCount: number;
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  /**
   * 無回答の正解開示中かどうか
   *
   * {@link reveal} で立ち、{@link proceed} で解除される。開示中も
   * `showFeedback` は true になる（盤面は回答時と同じ正解表示を描くため）。
   */
  readonly isRevealed: boolean;
  /**
   * 回答処理。フィードバック表示後に onNext で次問題へ進む
   *
   * {@link UseTrainingSessionOptions.holdAfterAnswer} 指定時は自動で進まず、
   * {@link proceed} の呼び出しを待つ。
   */
  readonly handleAnswer: (correct: boolean, onNext: () => void) => void;
  /**
   * 無回答のまま正解を開示し、{@link proceed} の呼び出しまで停止する
   *
   * 「わからない」操作用。回答ではないため正解数・出題数には含めない。
   * フィードバック表示中・開示中は何もしない。
   */
  readonly reveal: (onNext: () => void) => void;
  /**
   * 停止状態（回答後の停止・正解開示）から次問題へ進む
   *
   * 停止していないときは何もしない。
   */
  readonly proceed: () => void;
}

/**
 * 練習のトレーニングセッション管理
 *
 * 時間無制限・ミス無制限の反復練習用。正解数と出題数のみを集計し、
 * 回答ごとにフィードバックを挟んで次の問題へ自動で進む
 * （{@link UseTrainingSessionOptions.holdAfterAnswer} 指定時は操作を待つ）。
 *
 * 盤面の表示が切り替わる操作（回答・開示・次へ進む）では、あわせて練習の
 * 先頭へスクロールして戻す。これらのボタンは盤面下端やフッターにあり、
 * 手牌符のように縦に長い練習では押した位置のままだと盤面上部に出る
 * 正解表示も次の問題も画面外に残るため。
 */
export function useTrainingSession({
  feedbackDurationMs = 800,
  holdAfterAnswer = false,
}: UseTrainingSessionOptions = {}): TrainingSessionState {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<
    boolean | undefined
  >(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // 停止（回答後の停止・正解開示）からの「次へ進む」処理。proceed が呼ばれるまで保持する
  const pendingNextRef = useRef<(() => void) | undefined>(undefined);

  const handleAnswer = useCallback(
    (correct: boolean, onNext: () => void) => {
      if (showFeedback) return;

      scrollToPracticeAnchor();
      setShowFeedback(true);
      setLastAnswerCorrect(correct);
      setTotalCount((c) => c + 1);
      if (correct) setCorrectCount((c) => c + 1);

      if (holdAfterAnswer) {
        pendingNextRef.current = onNext;
        return;
      }

      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false);
        setLastAnswerCorrect(undefined);
        onNext();
      }, feedbackDurationMs);
    },
    [showFeedback, feedbackDurationMs, holdAfterAnswer],
  );

  const reveal = useCallback(
    (onNext: () => void) => {
      if (showFeedback) return;

      scrollToPracticeAnchor();
      // lastAnswerCorrect は undefined のまま（正誤の演出は出さず、正解表示だけを出す）
      setShowFeedback(true);
      setIsRevealed(true);
      pendingNextRef.current = onNext;
    },
    [showFeedback],
  );

  const proceed = useCallback(() => {
    const next = pendingNextRef.current;
    if (next === undefined) return;
    scrollToPracticeAnchor();
    pendingNextRef.current = undefined;
    setShowFeedback(false);
    setIsRevealed(false);
    setLastAnswerCorrect(undefined);
    next();
  }, []);

  return useMemo(
    () => ({
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      isRevealed,
      handleAnswer,
      reveal,
      proceed,
    }),
    [
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      isRevealed,
      handleAnswer,
      reveal,
      proceed,
    ],
  );
}
