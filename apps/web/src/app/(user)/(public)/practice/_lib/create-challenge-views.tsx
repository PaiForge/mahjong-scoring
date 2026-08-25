"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import {
  practiceMenuBySlug,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";
import { ChallengeShell } from "../_components/challenge-shell";
import { TrainingShell } from "../_components/training-shell";
import { useRecordedResults } from "../_hooks/use-recorded-results";
import { useSaveOnFinish } from "../_hooks/use-save-on-finish";
import { useTimedSession } from "../_hooks/use-timed-session";
import { useTrainingSession } from "../_hooks/use-training-session";
import type { PracticeBoardProps } from "./practice-board-props";

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
  /**
   * play 中に training と同じ正誤カウンタを表示する
   *
   * 既定では従来どおりスコア数値 + ライフ表示のみ。
   */
  readonly showScoreCounter?: boolean;
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
  const { slug, maxWidth, renderBoard, showScoreCounter } = config;
  const { namespace, menuType, hasProblemList, mistakeLimit, timeLimit } =
    practiceMenuBySlug(slug);
  // 問題別フィードバック一覧を持つ練習だけが問題結果を sessionStorage に積む。
  // 一覧の有無はレジストリが唯一の定義で、結果ページとそのスケルトン
  // （loading.tsx / ChallengeShell）も同じ旗を見る。
  const resultStorageKey = hasProblemList
    ? resultStorageKeyFor(slug)
    : undefined;
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
        resultPath={`/practice/${slug}/result`}
        exitHref={`/practice/${slug}`}
        maxWidth={maxWidth}
        hasProblemList={hasProblemList}
        showScoreCounter={showScoreCounter}
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
  readonly lastAnswerCorrect: boolean | undefined;
  /**
   * 不正解で停止中の状態から次問題へ進む
   *
   * `holdOnIncorrect` を指定した練習だけが意味を持つ。盤面は解説の下に
   * この操作を呼ぶボタンを置く。
   */
  readonly onProceed: () => void;
}

/**
 * トレーニングビューの生成設定
 * トレーニングビュー設定
 */
export interface TrainingViewConfig<TProps> {
  /**
   * ルートスラッグ（例: "jantou-fu"）。
   * 辞書の namespace はレジストリから導出し、終了リンクのパス生成にも使う。
   */
  readonly slug: PracticeMenuSlug;
  /** シェル内部ラッパーの max-w クラス（未指定時はシェルの既定値） */
  readonly maxWidth?: string;
  /**
   * 不正解時にフィードバック表示のまま停止し、ユーザーの操作を待つ
   *
   * 解説を読ませたい練習向け。既定は自動で次問題へ進む。
   */
  readonly holdOnIncorrect?: boolean;
  /**
   * 盤面の描画
   *
   * ビューの render 中に無条件で呼ばれるため、この中でフックを呼んでもよい。
   */
  readonly renderBoard: (args: TrainingBoardArgs, props: TProps) => ReactNode;
}

/**
 * トレーニングモード（時間無制限・非記録）の本体ビューを生成するファクトリ
 * トレーニングビュー生成
 */
export function createTrainingView<TProps = Record<string, never>>(
  config: TrainingViewConfig<TProps>,
): (props: TProps) => ReactNode {
  const { slug, maxWidth, holdOnIncorrect, renderBoard } = config;
  const { namespace } = practiceMenuBySlug(slug);

  function TrainingView(props: TProps) {
    const t = useTranslations(namespace);
    const {
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      handleAnswer,
      proceed,
    } = useTrainingSession({ holdOnIncorrect });

    return (
      <TrainingShell
        title={t("title")}
        correctCount={correctCount}
        totalCount={totalCount}
        exitHref={`/practice/${slug}`}
        maxWidth={maxWidth}
      >
        {renderBoard(
          {
            showFeedback,
            lastAnswerCorrect,
            onAnswer: handleAnswer,
            onProceed: proceed,
          },
          props,
        )}
      </TrainingShell>
    );
  }
  TrainingView.displayName = `TrainingView(${slug})`;
  return TrainingView;
}
