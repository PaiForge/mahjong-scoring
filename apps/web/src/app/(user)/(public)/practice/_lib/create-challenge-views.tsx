"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import {
  isExamMenuType,
  practiceMenuBySlug,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";
import { ChallengeShell } from "../_components/challenge-shell";
import { TrainingShell } from "../_components/training-shell";
import { useRecordedResults } from "../_hooks/use-recorded-results";
import { useSaveOnFinish } from "../_hooks/use-save-on-finish";
import { useTimedSession } from "../_hooks/use-timed-session";
import { useTrainingSession } from "../_hooks/use-training-session";
import { TrainingModeProvider } from "../_hooks/use-training-mode";
import type { PracticeBoardProps } from "./practice-board-props";
import { practiceHref, practiceResultHref } from "./practice-catalog";

/**
 * チャレンジ盤面の描画に渡される状態
 * チャレンジ盤面引数
 */
export interface ChallengeBoardArgs<TResult> extends PracticeBoardProps {
  /** チャレンジではカウントダウンが必ずあるため必須 */
  readonly isCountingDown: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  /** 問題結果の記録（レジストリで `hasProblemList` の練習のみ終了時に保存される） */
  readonly recordResult: (result: TResult) => void;
}

/**
 * チャレンジ本体ビューの生成設定
 * チャレンジビュー設定
 */
export interface ChallengePlayViewConfig<TResult, TProps, TState> {
  /**
   * ルートスラッグ（例: "jantou-fu"）。
   * 辞書の namespace とスコア保存に使う練習メニュー種別はレジストリから導出し、
   * result / exit のパス生成にも使う。
   */
  readonly slug: PracticeMenuSlug;
  /** シェル内部ラッパーの max-w クラス（未指定時はシェルの既定値） */
  readonly maxWidth?: string;
  /**
   * 盤面が必要とする追加状態を用意するフック
   *
   * 出題状態の管理（`useScoreTableQuestion` など）やクエリ参照が要る練習向け。
   * ビュー先頭で無条件に呼ばれる。
   */
  readonly useBoardState?: (props: TProps) => TState;
  /** 盤面の描画 */
  readonly renderBoard: (
    args: ChallengeBoardArgs<TResult>,
    props: TProps,
    state: TState,
  ) => ReactNode;
}

/**
 * チャレンジ型練習の本体ビューを生成するファクトリ
 * チャレンジビュー生成
 *
 * 全チャレンジ型練習で共通の「セッション管理 → スコア保存 → シェル描画」の
 * 定型を一元化する。各練習は盤面の描画（renderBoard）と設定値のみを提供する。
 */
export function createChallengePlayView<
  TResult = never,
  TProps = Record<string, never>,
  TState = undefined,
>(
  config: ChallengePlayViewConfig<TResult, TProps, TState>,
): (props: TProps) => ReactNode {
  const { slug, maxWidth, renderBoard } = config;
  const {
    namespace,
    menuType,
    hasProblemList,
    hasSetup,
    mistakeLimit,
    timeLimit,
  } = practiceMenuBySlug(slug);
  // 問題別フィードバック一覧を持つ練習だけが問題結果を sessionStorage に積む。
  // 一覧の有無はレジストリが唯一の定義で、結果ページとそのスケルトン
  // （loading.tsx / ChallengeShell）も同じ旗を見る。
  const resultStorageKey = hasProblemList
    ? resultStorageKeyFor(slug)
    : undefined;
  // 昇級試験はランキングを持たないため、結果ページにプレビューが出ない。
  // 終了後のスケルトンからも枠を落として高さを揃える
  const hasLeaderboard = !isExamMenuType(menuType);
  const useBoardState =
    config.useBoardState ?? (() => undefined as unknown as TState);

  function ChallengePlayView(props: TProps) {
    const t = useTranslations(namespace);
    const boardState = useBoardState(props);
    // セッションルール（制限時間・ミス上限）はレジストリが正典。
    // 練習ごとの上書き（昇級試験のミス1回等）もここ経由で効く
    const { gameSession, timerControl } = useTimedSession({
      mistakeLimit,
      timeLimit,
    });
    const handleFinish = useSaveOnFinish(menuType);
    const { recordResult } = useRecordedResults<TResult>(
      resultStorageKey,
      gameSession.isFinished,
    );

    return (
      <ChallengeShell
        title={t("title")}
        gameSession={gameSession}
        timerControl={timerControl}
        resultPath={practiceResultHref(slug)}
        exitHref={practiceHref(slug)}
        maxWidth={maxWidth}
        hasProblemList={hasProblemList}
        hasSetup={hasSetup}
        hasLeaderboard={hasLeaderboard}
        onFinish={handleFinish}
      >
        {renderBoard(
          {
            showFeedback: gameSession.showFeedback,
            isCountingDown: gameSession.isCountingDown,
            lastAnswerCorrect: gameSession.lastAnswerCorrect,
            onAnswer: gameSession.handleAnswer,
            recordResult,
          },
          props,
          boardState,
        )}
      </ChallengeShell>
    );
  }
  ChallengePlayView.displayName = `ChallengePlayView(${slug})`;
  return ChallengePlayView;
}

/**
 * トレーニング盤面の描画に渡される状態
 * トレーニング盤面引数
 */
export interface TrainingBoardArgs extends PracticeBoardProps {
  /** トレーニングビューからの描画なので常に true */
  readonly isTraining: true;
  readonly lastAnswerCorrect: boolean | undefined;
}

/**
 * トレーニングビューの生成設定
 * トレーニングビュー設定
 */
export interface TrainingViewConfig<TProps, TState> {
  /**
   * ルートスラッグ（例: "jantou-fu"）。
   * 辞書の namespace はレジストリから導出し、終了リンクのパス生成にも使う。
   */
  readonly slug: PracticeMenuSlug;
  /** シェル内部ラッパーの max-w クラス（未指定時はシェルの既定値） */
  readonly maxWidth?: string;
  /**
   * 練習名の右隣に置くヘルプ（{@link import("../_components/practice-help-button").PracticeHelpButton}）
   *
   * 盤面を見ても読み取れない出題のルール（何を符に数え、何を数えないか）を
   * 置く場所。チャレンジ側には無い。
   */
  readonly help?: ReactNode;
  /**
   * 盤面が必要とする追加状態を用意するフック
   *
   * チャレンジ側の {@link ChallengePlayViewConfig.useBoardState} と同じ役割。
   * 出題条件をクエリから読む練習など、盤面の外に状態が要るとき使う。
   */
  readonly useBoardState?: (props: TProps) => TState;
  /**
   * 盤面の描画
   *
   * ビューの render 中に無条件で呼ばれるため、この中でフックを呼んでもよい。
   */
  readonly renderBoard: (
    args: TrainingBoardArgs,
    props: TProps,
    state: TState,
  ) => ReactNode;
}

/**
 * トレーニングモード（時間無制限・非記録）の本体ビューを生成するファクトリ
 * トレーニングビュー生成
 */
export function createTrainingView<
  TProps = Record<string, never>,
  TState = undefined,
>(config: TrainingViewConfig<TProps, TState>): (props: TProps) => ReactNode {
  const { slug, maxWidth, help, renderBoard } = config;
  const { namespace } = practiceMenuBySlug(slug);
  const useBoardState =
    config.useBoardState ?? (() => undefined as unknown as TState);

  function TrainingView(props: TProps) {
    const t = useTranslations(namespace);
    const boardState = useBoardState(props);
    const {
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      isRevealed,
      isHolding,
      handleAnswer,
      reveal,
      proceed,
    } = useTrainingSession();

    // 「次へ進む」操作は盤面が持つ（出題の差し替えと入力欄のリセットを含む）ため、
    // useTrainingReveal 経由で登録してもらう。生成待ちの間は undefined になる。
    const [advance, setAdvance] = useState<(() => void) | undefined>(undefined);
    const registerAdvance = useCallback(
      (next: (() => void) | undefined) => setAdvance(() => next),
      [],
    );
    const trainingMode = useMemo(
      () => ({ isRevealed, isHolding, registerAdvance }),
      [isRevealed, isHolding, registerAdvance],
    );

    return (
      <TrainingShell
        title={t("title")}
        titleAction={help}
        correctCount={correctCount}
        totalCount={totalCount}
        exitHref={practiceHref(slug)}
        maxWidth={maxWidth}
        onReveal={() => {
          if (advance) reveal(advance);
        }}
        revealDisabled={showFeedback || advance === undefined}
        isRevealed={isRevealed}
        isHolding={isHolding}
        onProceed={proceed}
      >
        <TrainingModeProvider value={trainingMode}>
          {renderBoard(
            {
              showFeedback,
              isTraining: true,
              lastAnswerCorrect,
              onAnswer: handleAnswer,
            },
            props,
            boardState,
          )}
        </TrainingModeProvider>
      </TrainingShell>
    );
  }
  TrainingView.displayName = `TrainingView(${slug})`;
  return TrainingView;
}
