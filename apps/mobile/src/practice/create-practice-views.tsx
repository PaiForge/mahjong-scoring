import { use, useCallback, useEffect, useRef, type ReactNode } from "react";
import { Platform, type ScrollViewInstance } from "react-native";
import { useRouter } from "expo-router";
import { HeaderHeightContext } from "expo-router/react-navigation";
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
import { HandPresentationProvider } from "./hand-presentation-provider";
import { PreparingScreen } from "./components/preparing-screen";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";
import { isQuotaMenu } from "@mahjong-scoring/features/quota/limits";
import {
  useQuotaQuestionHost,
  type QuotaQuestionHost,
} from "@mahjong-scoring/features/quota/use-quota-question-host";
import { showToast } from "../components/toast";
import { useCloseSession } from "../hooks/use-close-session";
import { PracticeQuotaPaywall } from "./quota/practice-quota-paywall";
import { PracticeQuotaRemaining } from "./quota/practice-quota-remaining";
import { usePracticeQuota } from "./quota/use-practice-quota";

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

/**
 * 盤面が表示を切り替えたときに本文を先頭へ戻す
 * 盤面の先頭へ戻す
 *
 * iOS では解答中の画面のヘッダーが透け、本文はその下へ潜る。OS がヘッダーの
 * 高さぶんの inset を付けるので、先頭の位置は `y: 0` ではなくその高さぶん負の
 * 値になる（`y: 0` へ戻すと、本文の頭がヘッダーの裏に潜った位置で止まる）。
 * 解答中の画面は見出しを持ち `stickyHeaderIndices` を使わない（ヘッダーが透ける）
 * ので、ヘッダーの高さをそのまま使う。Android はヘッダーを透けさせないので 0。
 *
 * 同じ処理を `endless/use-endless-board-shell.ts`
 * にも持つ（重複）。先頭の位置は `Screen` が付ける inset で決まるので、後で
 * `Screen` 側に「先頭へ戻す」を持たせて寄せる候補。
 */
function useScrollToTop() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const headerHeight = use(HeaderHeightContext) ?? 0;
  const top = Platform.OS === "ios" ? -headerHeight : 0;
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: top, animated: false });
  }, [top]);
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
    // 記録付きの回はサーバーの合格ラインで終える（手元の値は配布した
    // 時点のもので、サーバーが変えていれば食い違う）
    const sessionGoalCount = recorded?.goalCount ?? goalCount;
    const { gameSession, timerControl } = useTimedSession({
      mistakeLimit,
      timeLimit,
      goalCount: sessionGoalCount,
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
          goalCount: sessionGoalCount,
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
        sessionGoalCount,
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
  // 手牌の見せ方を決めてから始める（練習も昇級試験も）。記録付きチャレンジの
  // 開始（RecordedChallengeProvider）より外側で包み、決まるまで開始させない
  function PresentedPlayView(props: PracticeViewProps) {
    return (
      <HandPresentationProvider fallback={<PreparingScreen slug={slug} />}>
        <RecordedPlayView {...props} />
      </HandPresentationProvider>
    );
  }
  PresentedPlayView.displayName = `PresentedPlayView(${slug})`;
  return PresentedPlayView;
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
  /**
   * 回数制限に通す模試の出題（問題を 1 問作る。成立しなければ undefined）
   *
   * 試験のスラッグが回数制限の対象（`isQuotaMenu`）のときだけ使い、必須。
   * 盤面と同じ条件で作ること（`scoreExamQuestionGenerator`）。対象でない
   * 練習・模試では無視する（web の同名の設定と同じ）。
   */
  readonly generateQuestion?: () => unknown;
}

/** 回数制限の無い練習・模試の画面が呼ぶ、何も持たないホスト */
function useNoQuotaHost(): QuotaQuestionHost | undefined {
  return undefined;
}

/**
 * トレーニング（模試）の画面を作る
 * トレーニング画面生成
 *
 * web の `createTrainingView` と同じ形。チャレンジと同じ盤面を、時計も
 * ライフも無いセッションで動かす。
 *
 * 回数制限の対象の模試（1級・初段。`isQuotaMenu`）は出題を回数制限に通す
 * （web と同じ）。盤面には出題ホスト（`useQuotaQuestionHost`）で問題を渡し、
 * 上限に達したら画面ごとペイウォールに置き換える。ゲートの状態を画面が持つので、
 * ペイウォールからログイン・プラン画面へ行って戻ってきたときの聞き直し
 * （`usePracticeQuota` のフォーカス）もそのまま効く。
 */
export function createTrainingView(
  config: TrainingViewConfig,
): (props: PracticeViewProps) => ReactNode {
  const { slug, hasSubmitButton, help, renderBoard, generateQuestion } = config;
  const { namespace, mistakeLimit, timeLimit, kind } =
    challengeViewSettings(slug);
  // 回数制限の対象かはスラッグで決まる（生成時に固定。フックの呼び順が毎レンダー同じ）
  const quotaMenu = isQuotaMenu(slug) ? slug : undefined;
  if (quotaMenu !== undefined && generateQuestion === undefined) {
    throw new Error(
      `createTrainingView(${slug}): 回数制限の対象の模試には generateQuestion が要る`,
    );
  }
  const useQuotaHost =
    quotaMenu !== undefined && generateQuestion !== undefined
      ? () =>
          useQuotaQuestionHost(generateQuestion, (generate) =>
            usePracticeQuota(quotaMenu, generate),
          )
      : useNoQuotaHost;

  function TrainingView(props: PracticeViewProps) {
    const t = useTranslations(namespace);
    const tExam = useTranslations("examTraining");
    const tt = useTranslations("training");
    const tq = useTranslations("practiceQuota");
    const offersRealExam = useOffersRealExam();
    const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
    const { scrollRef, scrollToTop } = useScrollToTop();
    const exitHref = practiceHref(slug, props.variant);
    const closeSession = useCloseSession(exitHref);
    const session = useTrainingSession({
      autoAdvanceOnCorrect,
      onDisplayChange: scrollToTop,
    });

    const { trainingMode, reveal, revealDisabled } =
      useTrainingModeBridge(session);
    const quotaHost = useQuotaHost();
    const gate = quotaHost?.gate;

    useEffect(() => {
      if (gate?.kind === "rateLimited") showToast(tq("rateLimited"));
    }, [gate, tq]);

    const title =
      kind === "exam" ? tExam("pageTitle", { title: t("title") }) : t("title");

    // 無料枠を使い切った。問題は作っていないので画面ごと置き換える。戻るは
    // シェルの「終了する」と同じく、終えたことを知らせてからモーダルを閉じる
    if (quotaMenu !== undefined && gate?.kind === "blocked") {
      return (
        <PracticeQuotaPaywall
          menu={quotaMenu}
          title={title}
          limit={gate.limit}
          signedIn={gate.signedIn}
          backLabel={tq("paywall.backToExam")}
          onBackToSetup={() => {
            closeSession();
            showToast(kind === "exam" ? tExam("exitToast") : tt("exitToast"));
          }}
        />
      );
    }

    const board = renderBoard(
      {
        showFeedback: session.showFeedback,
        isTraining: true,
        lastAnswerCorrect: session.lastAnswerCorrect,
        onAnswer: session.handleAnswer,
      },
      props,
    );

    return (
      <TrainingShell
        title={title}
        variant={kind}
        correctCount={session.correctCount}
        totalCount={session.totalCount}
        challengeRules={{ timeLimit, mistakeLimit }}
        challengeHref={practicePlayHref(slug, props.variant)}
        exitHref={exitHref}
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
          {quotaHost === undefined ? (
            board
          ) : (
            <QuestionHostProvider value={quotaHost.host}>
              {board}
              {/* 無料枠の残り。Pro とまだ聞いていない間は何も描かない。
                  導線は解答前だけ（和了形の点数計算と同じ理由） */}
              {gate?.kind === "open" && (
                <PracticeQuotaRemaining
                  remaining={gate.remaining}
                  showPlanLink={!session.showFeedback}
                />
              )}
            </QuestionHostProvider>
          )}
        </TrainingModeProvider>
      </TrainingShell>
    );
  }
  TrainingView.displayName = `TrainingView(${slug})`;
  // トレーニングも模試も包む。セッションと出題のフックを持つ TrainingView より外側
  function PresentedTrainingView(props: PracticeViewProps) {
    return (
      <HandPresentationProvider fallback={<PreparingScreen slug={slug} />}>
        <TrainingView {...props} />
      </HandPresentationProvider>
    );
  }
  PresentedTrainingView.displayName = `PresentedTrainingView(${slug})`;
  return PresentedTrainingView;
}
