"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useAutoAdvanceOnCorrect } from "@/app/_hooks/use-training-settings-store";
import { scrollToPracticeAnchor } from "../_lib/scroll-anchor";

/**
 * 正解を自動で流すときにフィードバックを見せる時間（ms）
 *
 * チャレンジ（{@link useTimedSession}）の既定と同じ長さ。同じ「正解の
 * フラッシュ」が練習のモードによって速さを変えないため。
 */
const AUTO_ADVANCE_FEEDBACK_MS = 800;

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
   * 回答後の停止中かどうか
   *
   * {@link handleAnswer} で立ち、{@link proceed} で解除される。
   * 「次の問題へ」を出す側（シェル）と、回答ボタンを引っ込める側（盤面）が
   * 同じ状態を見るための旗。正解を自動で流す設定のときは、正解の
   * フィードバック中も立たない（押す操作が無いため）。
   */
  readonly isHolding: boolean;
  /**
   * 回答処理。正解表示を出したまま停止し、{@link proceed} の呼び出しを待つ
   *
   * 既定では正解・不正解のどちらでも止まる。正解でも止めるのは、合っていた
   * 根拠（符の内訳や符目ごとの正解）を確認する時間がトレーニングでは要るため。
   * 設定（{@link useAutoAdvanceOnCorrect}）で正解時だけ自動遷移にできる。
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
 * 時間無制限・ミス無制限の反復練習用。正解数と出題数のみを集計する。
 * チャレンジと違い、回答すると正解表示を出したまま停止し、ユーザーが
 * 「次の問題へ」を押すまで次の問題に変わらない（答え合わせのための時間を
 * 自動遷移で奪わないため）。設定で正解時だけ自動遷移にでき、その場合も
 * 不正解では止まる。
 *
 * 盤面の表示が切り替わる操作（回答・開示・次へ進む）では、あわせて練習の
 * 先頭へスクロールして戻す。これらのボタンは盤面下端やフッターにあり、
 * 手牌符のように縦に長い練習では押した位置のままだと盤面上部に出る
 * 正解表示も次の問題も画面外に残るため。
 */
export function useTrainingSession(): TrainingSessionState {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<
    boolean | undefined
  >(undefined);
  // 停止（回答後の停止・正解開示）からの「次へ進む」処理。proceed が呼ばれるまで保持する
  const pendingNextRef = useRef<(() => void) | undefined>(undefined);
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();

  const handleAnswer = useCallback(
    (correct: boolean, onNext: () => void) => {
      if (showFeedback) return;

      scrollToPracticeAnchor();
      setShowFeedback(true);
      setLastAnswerCorrect(correct);
      setTotalCount((c) => c + 1);
      if (correct) setCorrectCount((c) => c + 1);

      // 自動遷移は正解のときだけ。間違えた問題は答え合わせのために必ず止める
      if (correct && autoAdvanceOnCorrect) {
        setTimeout(() => {
          setShowFeedback(false);
          setLastAnswerCorrect(undefined);
          onNext();
        }, AUTO_ADVANCE_FEEDBACK_MS);
        return;
      }

      setIsHolding(true);
      pendingNextRef.current = onNext;
    },
    [showFeedback, autoAdvanceOnCorrect],
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
    setIsHolding(false);
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
      isHolding,
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
      isHolding,
      handleAnswer,
      reveal,
      proceed,
    ],
  );
}
