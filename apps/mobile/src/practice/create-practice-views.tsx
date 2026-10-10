import { useCallback, useRef, type ReactNode } from "react";
import type { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { type PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  practiceHref,
  practicePlayHref,
  practiceResultHref,
  variantQuery,
} from "@mahjong-scoring/features/routes";
import { useTimedSession } from "@mahjong-scoring/features/session/use-timed-session";
import { useTrainingSession } from "@mahjong-scoring/features/session/use-training-session";

import { useAutoAdvanceOnCorrect } from "../hooks/use-training-settings-store";
import type {
  ChallengeBoardArgs,
  TrainingBoardArgs,
} from "@mahjong-scoring/features/practice/board-props";
import { usePracticeAttemptStore } from "../hooks/use-practice-attempt-store";
import { useChallengeResultStore } from "./challenge-result-store";
import { ChallengeShell } from "./components/challenge-shell";
import { TrainingShell } from "./components/training-shell";
import { TrainingModeProvider } from "@mahjong-scoring/features/practice/use-training-mode";
import { useRecordedResults } from "@mahjong-scoring/features/challenge/use-recorded-results";
import { useTrainingModeBridge } from "@mahjong-scoring/features/practice/use-training-mode-bridge";
import { challengeViewSettings } from "@mahjong-scoring/features/practice/challenge-view-settings";
import { submitChallengeFinish } from "../records/account-sync";
import { ExamStartGate, useOffersRealExam } from "./exam/exam-start-gate";
import {
  RecordedChallengeProvider,
  useRecordedChallenge,
} from "./recorded-challenge";

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
 * チャレンジの画面を作る
 * チャレンジ画面生成
 *
 * web の `createChallengePlayView` と同じ形。セッション（時計・ライフ・
 * 終了判定）・結果の記録・結果画面への遷移はここが持ち、練習ごとに違うのは
 * 盤面だけにする。
 *
 * ログインしてユーザー名を決めた人のチャレンジは、web と同じくサーバーで
 * 採点・記録する（{@link RecordedChallengeProvider}）。ゲストは端末で採点し、
 * 記録せずに結果画面で今回の成績を見せ、「チャレンジを終えた練習」だけを
 * 端末のゲストの記録に残す。ログイン中のチャレンジはゲストの記録に書かない
 * （サーバーの記録が「練習した」を持つ）。
 *
 * 昇級試験（`kind === "exam"`）は記録付きでしか始めない。確定の応答が
 * 合否と付与した段級位を持ち、結果画面がそれを読む。
 */
export function createChallengePlayView<TResult = never>(
  config: ChallengePlayViewConfig<TResult>,
): (props: PracticeViewProps) => ReactNode {
  const { slug, renderBoard } = config;
  const { namespace, mistakeLimit, timeLimit, kind, goalCount } =
    challengeViewSettings(slug);

  function ChallengePlayView(props: PracticeViewProps) {
    const t = useTranslations(namespace);
    const router = useRouter();
    const recorded = useRecordedChallenge();
    const setAttempt = useChallengeResultStore((s) => s.setAttempt);
    const markAttempted = usePracticeAttemptStore((s) => s.markAttempted);
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
        if (!recorded) {
          // 黒帯への道の「練習した」は一度でも終えたこと（web の記録と同じ数え方）
          markAttempted(slug, props.variant);
        } else if (finalResult.totalCount > 0) {
          // 送っている回答の応答を待ってから確定する。1 問も答えずに
          // 終わったチャレンジは記録しない（web と同じ）
          const { userId, attemptId } = recorded;
          void recorded.settled().then(() =>
            submitChallengeFinish(userId, {
              attemptId,
              slug,
              variant: props.variant,
            }),
          );
        }
        setAttempt({
          slug,
          variant: props.variant,
          finalResult,
          elapsedMs,
          results: collect(finalResult.reason === "timeUp"),
          recordedAttemptId:
            recorded && finalResult.totalCount > 0
              ? recorded.attemptId
              : undefined,
        });
        router.replace(
          `${practiceResultHref(slug)}${variantQuery(slug, props.variant)}`,
        );
      },
      [
        gameSession.finalResult,
        recorded,
        markAttempted,
        setAttempt,
        props.variant,
        collect,
        router,
      ],
    );

    return (
      <ChallengeShell
        title={t("title")}
        gameSession={{
          ...gameSession,
          // 画面はすぐ止め、サーバーへは後から伝える。再開はサーバーが
          // 動き出したと確かめるまで回答と時計を止める（`RecordedChallenge.pause`）
          togglePause: () => {
            if (!gameSession.isCountingDown && !gameSession.isFinished)
              recorded?.pause(!gameSession.isPaused);
            gameSession.togglePause();
          },
        }}
        timerControl={{
          ...timerControl,
          // サーバーの採点を待つ間は時計を止め、応答が届いたらサーバーの
          // 時計に合わせ直す
          isActive: timerControl.isActive && !recorded?.isGrading,
          clock: recorded?.clock,
          onTimeLimitReached: recorded
            ? () => recorded.expire(timerControl.onTimeLimitReached)
            : timerControl.onTimeLimitReached,
        }}
        variant={kind}
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
  function RecordedPlayView(props: PracticeViewProps) {
    return (
      <RecordedChallengeProvider
        slug={slug}
        variant={props.variant}
        requireRecording={kind === "exam"}
      >
        <ChallengePlayView {...props} />
      </RecordedChallengeProvider>
    );
  }
  RecordedPlayView.displayName = `RecordedPlayView(${slug})`;
  return RecordedPlayView;
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
  const { namespace, mistakeLimit, timeLimit, kind } =
    challengeViewSettings(slug);

  function TrainingView(props: PracticeViewProps) {
    const t = useTranslations(namespace);
    const tExam = useTranslations("examTraining");
    const offersRealExam = useOffersRealExam();
    const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
    const { scrollRef, scrollToTop } = useScrollToTop();
    const session = useTrainingSession({
      autoAdvanceOnCorrect,
      onDisplayChange: scrollToTop,
    });

    const { trainingMode, reveal, revealDisabled } =
      useTrainingModeBridge(session);

    return (
      <TrainingShell
        title={
          kind === "exam"
            ? tExam("pageTitle", { title: t("title") })
            : t("title")
        }
        variant={kind}
        correctCount={session.correctCount}
        totalCount={session.totalCount}
        challengeRules={{ timeLimit, mistakeLimit }}
        challengeHref={practicePlayHref(slug, props.variant)}
        exitHref={practiceHref(slug, props.variant)}
        onReveal={reveal}
        revealDisabled={revealDisabled}
        isRevealed={session.isRevealed}
        isHolding={session.isHolding}
        onProceed={session.proceed}
        hasSubmitButton={hasSubmitButton}
        help={help}
        examStart={
          kind === "exam" && offersRealExam ? (
            <ExamStartGate
              slug={slug}
              startLabel={tExam("realExamButton")}
              replace
            />
          ) : undefined
        }
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
