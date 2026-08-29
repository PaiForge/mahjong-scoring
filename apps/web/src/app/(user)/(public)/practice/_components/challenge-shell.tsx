"use client";

import { type ReactNode, memo, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { BoardOverlay } from "@/app/(user)/_components/board-overlay";
import { PauseIcon } from "@/app/(user)/_components/icons/pause-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { ScoreCounter } from "./score-counter";
import type {
  GameSessionState,
  TimerControl,
} from "../_hooks/use-timed-session";
import type {
  FinishCallbackArgs,
  FinishCallbackResult,
} from "../_hooks/use-finish-redirect";
import { useGameTimer } from "../_hooks/use-game-timer";
import { useFinishRedirect } from "../_hooks/use-finish-redirect";
import { useQuitConfirm } from "../_hooks/use-quit-confirm";
import { useScrollToElement } from "../_hooks/use-scroll-to-element";
import {
  buildResultBreadcrumb,
  resultBreadcrumbParent,
} from "../_lib/result-breadcrumb";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { QuizTimer } from "./quiz-timer";
import { QuitConfirmModal } from "./quit-confirm-modal";
import { ResultPageSkeleton } from "./result-page-skeleton";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "./practice-footer-actions";

interface LifeIndicatorProps {
  readonly remainingLives: number;
  readonly mistakeLimit: number;
}

/** ライフ表示（ハートアイコン） */
const LifeIndicator = memo(function LifeIndicatorComponent({
  remainingLives,
  mistakeLimit,
}: LifeIndicatorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: mistakeLimit }, (_, i) => (
        <span
          key={i}
          className={`text-base ${i < remainingLives ? "text-red-500" : "text-surface-200"}`}
        >
          &#9829;
        </span>
      ))}
    </div>
  );
});

interface ChallengeShellProps {
  /**
   * 画面上部に表示する練習名（PageTitle に渡す）。
   * 終了後のスケルトンでパンくずのラベルにも使うため文字列に限定する。
   */
  readonly title: string;
  /** ゲームロジック状態（タイマー値を含まない） */
  readonly gameSession: GameSessionState;
  /** ChallengeShell 内でタイマーを制御するためのインターフェース */
  readonly timerControl: TimerControl;
  /** リザルトページへのパス（例: "/practice/jantou-fu/result"） */
  readonly resultPath: string;
  /**
   * 「やめる」確定時の遷移先（既定: "/practice"）。
   * 説明ページを持つ練習では説明ページ（例: "/practice/jantou-fu"）を渡す。
   */
  readonly exitHref?: string;
  /** 練習本体のUI */
  readonly children: ReactNode;
  /** 内部ラッパーの max-w クラス（既定: "max-w-md"） */
  readonly maxWidth?: string;
  /**
   * 結果ページが問題別フィードバック一覧を表示するか。
   * true の場合、終了後のスケルトンにも出題数分の一覧枠を描画して
   * 結果ページとの高さのずれを防ぐ。
   */
  readonly hasProblemList?: boolean;
  /**
   * 結果ページが「設定を変更する」ボタンを表示するか。
   * true の場合、終了後のスケルトンにもボタン枠を 2 つ描画して
   * 結果ページとの高さのずれを防ぐ。
   */
  readonly hasSetup?: boolean;
  /** play 中に training と同じ正誤カウンタを表示するか */
  readonly showScoreCounter?: boolean;
  /** 練習終了時に呼び出されるコールバック（スコア保存等） */
  readonly onFinish?: (
    args: FinishCallbackArgs,
  ) =>
    | Promise<FinishCallbackResult | void | undefined>
    | FinishCallbackResult
    | void;
}

/**
 * 練習共通シェル（カウントダウン・ステータスバー・ContentContainer）
 * 練習共通外殻
 *
 * タイマー状態（elapsedMs, remainingSeconds）は ChallengeShell 内の useGameTimer で管理される。
 * これにより 100ms ごとのタイマー更新は ChallengeShell のみが再レンダリングし、
 * children（練習本体の牌画像・選択肢ボタン等）には伝播しない。
 */
export function ChallengeShell({
  title,
  gameSession,
  timerControl,
  resultPath,
  children,
  maxWidth = "max-w-md",
  exitHref = "/practice",
  hasProblemList = false,
  hasSetup = false,
  showScoreCounter = false,
  onFinish,
}: ChallengeShellProps) {
  const tc = useTranslations("challenge");
  // 説明ページを持つ練習では exitHref が説明ページ URL になっている
  // （既定値の練習一覧は除く）。結果ページが受け取る introHref と一致する。
  const introHref = exitHref === "/practice" ? undefined : exitHref;
  // 親一覧（練習一覧 or 道場）。終了後スケルトンのパンくずを実描画と揃える
  const parent = resultBreadcrumbParent(introHref);
  const tParent = useTranslations(parent.namespace);

  // 練習開始直後、グローバルヘッダ分のオフセットを解消して盤面を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  const wasPausedBeforeQuitRef = useRef(false);

  const handleQuitOpen = useCallback(() => {
    wasPausedBeforeQuitRef.current = gameSession.isPaused;
    if (!gameSession.isPaused) {
      gameSession.togglePause();
    }
  }, [gameSession]);

  const handleQuitCancelResume = useCallback(() => {
    if (!wasPausedBeforeQuitRef.current) {
      gameSession.togglePause();
    }
  }, [gameSession]);

  const {
    isQuitModalOpen,
    handleQuitClick,
    handleQuitCancel,
    handleQuitConfirm,
  } = useQuitConfirm({
    onOpen: handleQuitOpen,
    onCancel: handleQuitCancelResume,
    exitHref,
  });

  const {
    remainingSeconds,
    elapsedMs,
    reset: resetTimer,
  } = useGameTimer({
    timeLimit: gameSession.timeLimit,
    onTimeLimitReached: timerControl.onTimeLimitReached,
    isActive: timerControl.isActive,
  });

  // タイマーリセット関数を timerControl に登録（セッションリセット時に使用）
  const registerTimerResetRef = useRef(timerControl.registerTimerReset);
  useEffect(() => {
    registerTimerResetRef.current = timerControl.registerTimerReset;
  });
  useEffect(() => {
    registerTimerResetRef.current(resetTimer);
  }, [resetTimer]);

  useFinishRedirect({
    isFinished: gameSession.isFinished,
    finalResult: gameSession.finalResult,
    elapsedMs,
    resultPath,
    onFinish,
  });

  // 終了後はスコア保存 → 結果ページ遷移までの間、白画面を出さずに
  // 結果ページ形状のスケルトンを表示する（遷移中も古いルートとして残り続ける）。
  if (gameSession.isFinished) {
    return (
      <ResultPageSkeleton
        practiceTitle={title}
        breadcrumb={buildResultBreadcrumb({
          parentLabel: tParent("title"),
          parentHref: parent.href,
          practiceTitle: title,
          resultLabel: tc("resultSuffix"),
          introHref,
        })}
        // 結果ページの一覧は URL の total（= 終了時の totalCount）分だけ並ぶ。
        problemCount={
          hasProblemList
            ? (gameSession.finalResult?.totalCount ?? gameSession.totalCount)
            : 0
        }
        hasSetup={hasSetup}
      />
    );
  }

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{title}</PageTitle>

      {/* Countdown overlay */}
      {gameSession.isCountingDown && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <span className="text-6xl font-bold text-primary-500 animate-pulse">
            {gameSession.countdownValue}
          </span>
        </div>
      )}

      <div className={`mx-auto ${maxWidth}`}>
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <QuizTimer
              timeRemaining={remainingSeconds}
              progress={elapsedMs / 1000 / gameSession.timeLimit}
            />
            <button
              type="button"
              onClick={gameSession.togglePause}
              disabled={gameSession.isCountingDown || gameSession.isFinished}
              className="rounded-md p-1 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:pointer-events-none"
              aria-label={gameSession.isPaused ? tc("resume") : tc("pause")}
            >
              {gameSession.isPaused ? (
                <PlayIcon className="size-4" />
              ) : (
                <PauseIcon className="size-4" />
              )}
            </button>
          </div>
          <LifeIndicator
            remainingLives={gameSession.remainingLives}
            mistakeLimit={gameSession.mistakeLimit}
          />
        </div>

        {/* Game content area - overlay scoped here to keep status bar accessible.

            <sm では盤面が白カードの左右パディング（p-4）を打ち消して画面端まで
            広がる（TehaiDisplay の fullBleed）。オーバーレイは inset-0 でこの箱を
            覆うため、箱がパディングの内側のままだと盤面の左右 16px が覆われず、
            手牌が両端だけ透けて見える。外側へ -mx-4 で広げ、同じ幅を px-4 で
            戻すことで、中の要素の位置は変えずに箱だけを盤面と同じ幅にする
            （sm 以上は盤面が広がらないので元に戻す）。 */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            className={gameSession.isPaused ? "blur-sm select-none" : undefined}
          >
            {children}
          </div>

          <BoardOverlay isVisible={gameSession.isPaused}>
            <button
              type="button"
              onClick={gameSession.togglePause}
              className="rounded-full bg-white/80 p-4 text-surface-700 shadow-lg transition-transform hover:scale-110 active:scale-95"
              aria-label={tc("resume")}
            >
              <PlayIcon className="size-12" />
            </button>
          </BoardOverlay>
        </div>

        {showScoreCounter ? (
          // TrainingShell と同じく、盤面・正誤カウンタ・終了操作を 8 (32px) 間隔で並べる。
          <div className="mt-8 space-y-8">
            <ScoreCounter
              correct={gameSession.correctCount}
              incorrect={gameSession.incorrectCount}
              correctLabel={tc("correct")}
              incorrectLabel={tc("incorrect")}
            />

            <PracticeFooterActions>
              <PracticeFooterAction onClick={handleQuitClick}>
                {tc("quitButton")}
              </PracticeFooterAction>
            </PracticeFooterActions>
          </div>
        ) : (
          /* Quit button */
          <div className="mt-6">
            <PracticeFooterActions>
              <PracticeFooterAction onClick={handleQuitClick}>
                {tc("quitButton")}
              </PracticeFooterAction>
            </PracticeFooterActions>
          </div>
        )}
      </div>

      <QuitConfirmModal
        isOpen={isQuitModalOpen}
        onConfirm={handleQuitConfirm}
        onCancel={handleQuitCancel}
      />
    </ContentContainer>
  );
}
