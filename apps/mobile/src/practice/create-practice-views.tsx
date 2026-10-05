import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  isExamMenuType,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  practiceHref,
  practicePlayHref,
  practiceResultHref,
  variantQuery,
} from "@mahjong-scoring/features/routes";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import { useTimedSession } from "@mahjong-scoring/features/session/use-timed-session";
import { useTrainingSession } from "@mahjong-scoring/features/session/use-training-session";

import { useAutoAdvanceOnCorrect } from "../hooks/use-training-settings-store";
import type {
  ChallengeBoardArgs,
  TrainingBoardArgs,
} from "@mahjong-scoring/features/practice/board-props";
import { useChallengeResultStore } from "./challenge-result-store";
import { ChallengeShell } from "./components/challenge-shell";
import { TrainingShell } from "./components/training-shell";
import { TrainingModeProvider } from "@mahjong-scoring/features/practice/use-training-mode";

/** 練習の画面が受け取る props（URL の `?variant=` を正規化した値） */
export interface PracticeViewProps {
  readonly variant: string;
}

interface ChallengePlayViewConfig<TResult> {
  readonly slug: PracticeMenuSlug;
  readonly renderBoard: (
    args: ChallengeBoardArgs<TResult>,
    props: PracticeViewProps,
  ) => ReactNode;
}

/** 盤面が表示を切り替えたときに画面の先頭へ戻す */
function useScrollToTop() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);
  return { scrollRef, scrollToTop };
}

/**
 * 問題別の結果を積む
 * 結果記録
 *
 * web の `useRecordedResults` と同じく、答えた問題を順に積み、出題中の
 * 問題を「回答なし」で控えておく（時間切れで終わったとき一覧の末尾に残す）。
 */
function useRecordedResults<TResult>() {
  const resultsRef = useRef<TResult[]>([]);
  const pendingRef = useRef<TResult | undefined>(undefined);
  const recordResult = useCallback((result: TResult) => {
    resultsRef.current.push(result);
    pendingRef.current = undefined;
  }, []);
  const presentQuestion = useCallback((unanswered: TResult) => {
    pendingRef.current = unanswered;
  }, []);
  const collect = useCallback((timeUp: boolean): readonly TResult[] => {
    const pending = pendingRef.current;
    return timeUp && pending !== undefined
      ? [...resultsRef.current, pending]
      : [...resultsRef.current];
  }, []);
  return { recordResult, presentQuestion, collect };
}

/**
 * チャレンジの画面を作る
 * チャレンジ画面生成
 *
 * web の `createChallengePlayView` と同じ形。セッション（時計・ライフ・
 * 終了判定）・結果の記録・結果画面への遷移はここが持ち、練習ごとに違うのは
 * 盤面だけにする。記録は端末に残さない — 記録・ランキング・段級位はアカウントに
 * 紐づくもので、モバイルはまだログインを持たないため、結果画面で今回の成績を
 * 見せるところまでにする。
 */
export function createChallengePlayView<TResult = never>(
  config: ChallengePlayViewConfig<TResult>,
): (props: PracticeViewProps) => ReactNode {
  const { slug, renderBoard } = config;
  const { namespace, menuType, mistakeLimit, timeLimit } =
    practiceMenuBySlug(slug);
  const isExam = isExamMenuType(menuType);
  const goalCount = rankRequiringMenu(menuType)?.requirement.minScore;

  function ChallengePlayView(props: PracticeViewProps) {
    const t = useTranslations(namespace);
    const router = useRouter();
    const setAttempt = useChallengeResultStore((s) => s.setAttempt);
    const { scrollRef, scrollToTop } = useScrollToTop();
    const { gameSession, timerControl } = useTimedSession({
      mistakeLimit,
      timeLimit,
      goalCount,
      onDisplayChange: scrollToTop,
    });
    const { recordResult, presentQuestion, collect } =
      useRecordedResults<TResult>();

    const handleFinish = useCallback(
      (elapsedMs: number) => {
        const finalResult = gameSession.finalResult;
        if (finalResult === undefined) return;
        setAttempt({
          slug,
          variant: props.variant,
          finalResult,
          elapsedMs,
          results: collect(finalResult.reason === "timeUp"),
        });
        router.replace(
          `${practiceResultHref(slug)}${variantQuery(slug, props.variant)}`,
        );
      },
      [gameSession.finalResult, setAttempt, props.variant, collect, router],
    );

    return (
      <ChallengeShell
        title={t("title")}
        gameSession={gameSession}
        timerControl={timerControl}
        variant={isExam ? "exam" : "practice"}
        exitHref={practiceHref(slug, props.variant)}
        onFinish={handleFinish}
        scrollRef={scrollRef}
      >
        {renderBoard(
          {
            showFeedback: gameSession.showFeedback,
            isCountingDown: gameSession.isCountingDown,
            lastAnswerCorrect: gameSession.lastAnswerCorrect,
            onAnswer: gameSession.handleAnswer,
            recordResult,
            presentQuestion,
          },
          props,
        )}
      </ChallengeShell>
    );
  }
  ChallengePlayView.displayName = `ChallengePlayView(${slug})`;
  return ChallengePlayView;
}

interface TrainingViewConfig {
  readonly slug: PracticeMenuSlug;
  /** 盤面が自前の回答ボタンを持つか（{@link TrainingShell} の同名 prop） */
  readonly hasSubmitButton?: boolean;
  /** 練習名の右隣に置くヘルプ（{@link TrainingShell} の同名 prop） */
  readonly help?: ReactNode;
  readonly renderBoard: (
    args: TrainingBoardArgs,
    props: PracticeViewProps,
  ) => ReactNode;
}

/**
 * トレーニング（模試）の画面を作る
 * トレーニング画面生成
 *
 * web の `createTrainingView` と同じ形。チャレンジと同じ盤面を、時計も
 * ライフも無いセッションで動かす。
 */
export function createTrainingView(
  config: TrainingViewConfig,
): (props: PracticeViewProps) => ReactNode {
  const { slug, hasSubmitButton, help, renderBoard } = config;
  const { namespace, menuType, mistakeLimit, timeLimit } =
    practiceMenuBySlug(slug);
  const isExam = isExamMenuType(menuType);

  function TrainingView(props: PracticeViewProps) {
    const t = useTranslations(namespace);
    const tExam = useTranslations("examTraining");
    const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
    const { scrollRef, scrollToTop } = useScrollToTop();
    const session = useTrainingSession({
      autoAdvanceOnCorrect,
      onDisplayChange: scrollToTop,
    });

    const [advance, setAdvance] = useState<(() => void) | undefined>(undefined);
    const registerAdvance = useCallback(
      (next: (() => void) | undefined) => setAdvance(() => next),
      [],
    );
    const trainingMode = useMemo(
      () => ({
        isRevealed: session.isRevealed,
        isHolding: session.isHolding,
        registerAdvance,
      }),
      [session.isRevealed, session.isHolding, registerAdvance],
    );

    return (
      <TrainingShell
        title={isExam ? tExam("pageTitle", { title: t("title") }) : t("title")}
        variant={isExam ? "exam" : "practice"}
        correctCount={session.correctCount}
        totalCount={session.totalCount}
        challengeRules={{ timeLimit, mistakeLimit }}
        challengeHref={practicePlayHref(slug, props.variant)}
        exitHref={practiceHref(slug, props.variant)}
        onReveal={() => {
          if (advance) session.reveal(advance);
        }}
        revealDisabled={session.showFeedback || advance === undefined}
        isRevealed={session.isRevealed}
        isHolding={session.isHolding}
        onProceed={session.proceed}
        hasSubmitButton={hasSubmitButton}
        help={help}
        scrollRef={scrollRef}
      >
        <TrainingModeProvider value={trainingMode}>
          {renderBoard(
            {
              showFeedback: session.showFeedback,
              isTraining: true,
              lastAnswerCorrect: session.lastAnswerCorrect,
              onAnswer: session.handleAnswer,
            },
            props,
          )}
        </TrainingModeProvider>
      </TrainingShell>
    );
  }
  TrainingView.displayName = `TrainingView(${slug})`;
  return TrainingView;
}
