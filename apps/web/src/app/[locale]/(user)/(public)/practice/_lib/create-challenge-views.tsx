"use client";

import {
  VerifiedChallengeProvider,
  useVerifiedChallenge,
} from "../_hooks/use-verified-challenge";
import { type ReactNode, useCallback, useEffect } from "react";
import { useLocalizedRouter } from "../_hooks/use-localized-router";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  practiceMenuBySlug,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";
import { useSubmitExamOnFinish } from "@/app/[locale]/(user)/(public)/exam/_hooks/use-submit-exam-on-finish";
import {
  CHALLENGE_SHELL_MAX_WIDTH,
  ChallengeShell,
} from "../_components/challenge-shell";
import { TrainingShell } from "../_components/training-shell";
import { useStoredRecordedResults } from "../_hooks/use-stored-recorded-results";
import { useSaveOnFinish } from "../_hooks/use-save-on-finish";
import { useTimedSession } from "../_hooks/use-timed-session";
import { useTrainingSession } from "../_hooks/use-training-session";
import { TrainingModeProvider } from "@mahjong-scoring/features/practice/use-training-mode";
import type {
  ChallengeBoardArgs,
  TrainingBoardArgs,
} from "@mahjong-scoring/features/practice/board-props";
import {
  practiceHref,
  practiceResultHref,
} from "@mahjong-scoring/features/routes";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";
import { isQuotaMenu } from "@mahjong-scoring/features/quota/limits";
import {
  useQuotaQuestionHost,
  type QuotaQuestionHost,
} from "@mahjong-scoring/features/quota/use-quota-question-host";
import { PracticeQuotaPaywall } from "../_components/practice-quota-paywall";
import { PracticeQuotaRemaining } from "../_components/practice-quota-remaining";
import { usePracticeQuota } from "../_hooks/use-practice-quota";
import { useTrainingModeBridge } from "@mahjong-scoring/features/practice/use-training-mode-bridge";
import { challengeViewSettings } from "@mahjong-scoring/features/practice/challenge-view-settings";
import { HandPresentationProvider } from "../_components/hand-presentation-provider";
import { PracticePlayLoadingFallback } from "../_components/practice-play-loading-fallback";
import { PlayBoardSkeleton } from "../_components/play-board-skeleton";
import { BOARD_HEIGHT_BY_SLUG } from "./board-area-height";

/**
 * チャレンジ本体ビューの生成設定
 * チャレンジビュー設定
 */
/**
 * 盤面の状態を持たない設定の既定 `useBoardState`
 *
 * `useBoardState` を省略した設定では `TState` が既定の `undefined` になる。
 * 「省略」と「TState = undefined」が同時に決まることを型では結べないため、
 * ここで undefined を TState として返す。
 */
function useNoBoardState<TState>(): TState {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- useBoardState 省略時の TState は既定の undefined（上の TSDoc 参照）
  return undefined as TState;
}

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
  TProps extends object = Record<string, never>,
  TState = undefined,
>(
  config: ChallengePlayViewConfig<TResult, TProps, TState>,
): (props: TProps) => ReactNode {
  const { slug, maxWidth, renderBoard } = config;
  // 開始前の待ち画面も本体と同じ列幅で描く（替わるときに幅が揺れない）
  const columnWidth = maxWidth ?? CHALLENGE_SHELL_MAX_WIDTH;
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
  // 昇級試験は結果ページの形が違う（合否サマリ・記録の節とランキング無し）。
  // 終了後のスケルトンも同じ形にして高さを揃える。中断時の文言も
  // 「チャレンジ」ではなく「試験」で出す
  const { kind: variant, goalCount } = challengeViewSettings(slug);
  // 終了時の処理も試験と練習で分かれる — 練習は結果を記録し、試験は記録せず
  // 採点だけする。どちらを使うかはコンポーネント生成時に固定されるため、
  // フックの呼び出し順は毎レンダー同じ
  const useFinishHandler =
    variant === "exam" ? useSubmitExamOnFinish : useSaveOnFinish;
  const useBoardState = config.useBoardState ?? useNoBoardState;

  function ChallengePlayView(props: TProps) {
    const t = useTranslations(namespace);
    const verified = useVerifiedChallenge();
    const boardState = useBoardState(props);
    // チャレンジのルール（制限時間・ミス上限）はレジストリが正典。
    // 練習ごとの上書き（昇級試験のミス1回等）もここ経由で効く
    const { gameSession, timerControl } = useTimedSession({
      mistakeLimit,
      timeLimit,
      goalCount,
    });
    const handleFinish = useFinishHandler(menuType);
    const { recordResult, presentQuestion } = useStoredRecordedResults<TResult>(
      resultStorageKey,
      gameSession.finalResult,
    );

    return (
      <ChallengeShell
        title={t("title")}
        slug={slug}
        gameSession={{
          ...gameSession,
          togglePause: () => {
            if (!verified) {
              gameSession.togglePause();
              return;
            }
            void verified.pause(!gameSession.isPaused).then((ok) => {
              if (ok) gameSession.togglePause();
            });
          },
        }}
        timerControl={{
          ...timerControl,
          // サーバーの採点を待つ間は時計を止め、応答が届いたらサーバーの
          // 時計に合わせ直す（サーバー側も受付後に固定の猶予だけ止めている）
          isActive: timerControl.isActive && !verified?.isGrading,
          clock: verified?.clock,
          onTimeLimitReached: verified
            ? () => verified.expire(timerControl.onTimeLimitReached)
            : timerControl.onTimeLimitReached,
          reset: verified ? verified.restart : timerControl.reset,
        }}
        resultPath={practiceResultHref(slug)}
        maxWidth={maxWidth}
        hasProblemList={hasProblemList}
        hasSetup={hasSetup}
        variant={variant}
        reconnect={verified?.reconnect}
        onFinish={handleFinish}
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
          boardState,
        )}
      </ChallengeShell>
    );
  }
  ChallengePlayView.displayName = `ChallengePlayView(${slug})`;
  function VerifiedPlayView(props: TProps) {
    return (
      <VerifiedChallengeProvider slug={slug} maxWidth={columnWidth}>
        <ChallengePlayView {...props} />
      </VerifiedChallengeProvider>
    );
  }
  // 手牌の見せ方を決めてから始める（練習も昇級試験も）。チャレンジの開始
  // （VerifiedChallengeProvider の開始 API）より外側で包み、決まるまで開始させない。
  // 待つ間は開始 API の待ちと同じスケルトンを出す
  return function PresentedPlayView(props: TProps) {
    return (
      <HandPresentationProvider
        fallback={
          <PracticePlayFallback
            slug={slug}
            namespace={namespace}
            maxWidth={columnWidth}
          />
        }
      >
        <VerifiedPlayView {...props} />
      </HandPresentationProvider>
    );
  };
}

/** 何もしない（押せない操作の置き場所用） */
function noop() {}

/** チャレンジの見せ方が決まるまでのスケルトン（開始 API の待ちと同じ） */
function PracticePlayFallback({
  slug,
  namespace,
  maxWidth,
}: {
  readonly slug: PracticeMenuSlug;
  readonly namespace: ReturnType<typeof practiceMenuBySlug>["namespace"];
  readonly maxWidth: string;
}) {
  const t = useTranslations(namespace);
  return (
    <PracticePlayLoadingFallback
      practiceTitle={t("title")}
      mistakeLimit={practiceMenuBySlug(slug).mistakeLimit}
      boardHeight={BOARD_HEIGHT_BY_SLUG[slug]}
      maxWidth={maxWidth}
    />
  );
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
   * 盤面が自前の回答ボタンを持つか（{@link import("../_components/training-shell").TrainingShell} の `hasSubmitButton`
   * にそのまま渡す）。選択肢をタップした瞬間に確定する練習は指定しない
   */
  readonly hasSubmitButton?: boolean;
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
  /**
   * 回数制限に通す模試の出題（問題を 1 問作る。成立しなければ undefined）
   *
   * 試験のスラッグが回数制限の対象（`isQuotaMenu`）のときだけ使い、必須。
   * 盤面と同じ条件で作ること（`scoreExamQuestionGenerator`）。対象でない
   * 練習・模試では無視する。
   */
  readonly generateQuestion?: () => unknown;
}

/** 回数制限の無い練習・模試のビューが呼ぶ、何も持たないホスト */
function useNoQuotaHost(): QuotaQuestionHost | undefined {
  return undefined;
}

/**
 * トレーニングモード（時間無制限・非記録）の本体ビューを生成するファクトリ
 * トレーニングビュー生成
 *
 * 昇級試験のスラッグを渡すと模試になる。仕組みは練習のトレーニングと同じで、
 * 違うのは見出し（試験名に「（模試）」を添える）と、シェルの文言・末尾の
 * 導線が「チャレンジ」ではなく「本番の試験」を指すことだけ。
 *
 * 回数制限の対象の模試（1級・初段。`isQuotaMenu`）は出題を回数制限に通す。
 * 盤面には出題ホスト（`useQuotaQuestionHost`）で問題を渡し、盤面は本番と
 * 同じコードのまま。上限に達したら盤面ごとペイウォールに置き換える
 * （和了形の点数計算と同じ）。ゲートの状態をビューが持つのは、シェル
 * （見出し・カウンタ・本番への導線）の中にペイウォールを入れないため。
 */
export function createTrainingView<
  TProps extends object = Record<string, never>,
  TState = undefined,
>(config: TrainingViewConfig<TProps, TState>): (props: TProps) => ReactNode {
  const { slug, maxWidth, hasSubmitButton, help, renderBoard } = config;
  // チャレンジ側のルール（制限時間・ミス上限）は CTA の補足文に出す
  const {
    namespace,
    mistakeLimit,
    timeLimit,
    kind: variant,
  } = challengeViewSettings(slug);
  const useBoardState = config.useBoardState ?? useNoBoardState;
  // 回数制限の対象かはスラッグで決まる（生成時に固定。フックの呼び順が毎レンダー同じ）
  const quotaMenu = isQuotaMenu(slug) ? slug : undefined;
  const { generateQuestion } = config;
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

  function TrainingView(props: TProps) {
    const t = useTranslations(namespace);
    const tExamTraining = useTranslations("examTraining");
    const tq = useTranslations("practiceQuota");
    const tt = useTranslations("training");
    const router = useLocalizedRouter();
    const boardState = useBoardState(props);
    const session = useTrainingSession();
    const {
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      isRevealed,
      isHolding,
      handleAnswer,
      proceed,
    } = session;
    // 「次へ進む」操作は盤面が持つ（出題の差し替えと入力欄のリセットを含む）ため、
    // 盤面に登録してもらう。生成待ちの間は「わからない」を押せない
    const { trainingMode, reveal, revealDisabled } =
      useTrainingModeBridge(session);
    const quotaHost = useQuotaHost();
    const gate = quotaHost?.gate;

    useEffect(() => {
      if (gate?.kind === "rateLimited") toast.error(tq("rateLimited"));
    }, [gate, tq]);

    const title =
      variant === "exam"
        ? tExamTraining("pageTitle", { title: t("title") })
        : t("title");

    // ペイウォールの「試験の説明に戻る」。シェルの「終了する」と同じく、
    // 終えたことをトーストで知らせてから説明ページへ戻す
    const handleBackToIntro = useCallback(() => {
      const href = practiceHref(slug);
      toastOnArrival(
        href,
        variant === "exam" ? tExamTraining("exitToast") : tt("exitToast"),
      );
      router.push(href);
    }, [router, tExamTraining, tt]);

    // 無料枠を使い切った。問題は作っていないので盤面ごと置き換える
    if (quotaMenu !== undefined && gate?.kind === "blocked") {
      return (
        <PracticeQuotaPaywall
          menu={quotaMenu}
          title={title}
          limit={gate.limit}
          signedIn={gate.signedIn}
          backLabel={tq("paywall.backToExam")}
          onBackToSetup={handleBackToIntro}
        />
      );
    }

    const board = renderBoard(
      {
        showFeedback,
        isTraining: true,
        lastAnswerCorrect,
        onAnswer: handleAnswer,
      },
      props,
      boardState,
    );

    return (
      <TrainingShell
        // 模試は本番と同じ試験名で始まる見出しになるため、模試だと分かる
        // 添え字を付ける（タイマーが無いだけでは本番と見分けにくい）
        title={title}
        slug={slug}
        variant={variant}
        titleAction={help}
        correctCount={correctCount}
        totalCount={totalCount}
        challengeRules={{ timeLimit, mistakeLimit }}
        maxWidth={maxWidth}
        onReveal={reveal}
        revealDisabled={revealDisabled}
        isRevealed={isRevealed}
        isHolding={isHolding}
        onProceed={proceed}
        hasSubmitButton={hasSubmitButton}
      >
        <TrainingModeProvider value={trainingMode}>
          {quotaHost === undefined ? (
            board
          ) : (
            <QuestionHostProvider value={quotaHost.host}>
              {board}
              {/* 無料枠の残り。Pro とまだ聞いていない間は何も描かない。
                  リンクは解答前だけ（和了形の点数計算と同じ理由） */}
              {gate?.kind === "open" && (
                <div className="mt-4">
                  <PracticeQuotaRemaining
                    remaining={gate.remaining}
                    showPlanLink={!showFeedback}
                  />
                </div>
              )}
            </QuestionHostProvider>
          )}
        </TrainingModeProvider>
      </TrainingShell>
    );
  }
  TrainingView.displayName = `TrainingView(${slug})`;

  /**
   * 見せ方が決まるまでのトレーニング画面
   *
   * 出題の生成待ちと同じ形（シェル + 盤面のスケルトン）。盤面とセッションの
   * フックは持たない
   */
  function TrainingFallback() {
    const t = useTranslations(namespace);
    const tExamTraining = useTranslations("examTraining");
    return (
      <TrainingShell
        title={
          variant === "exam"
            ? tExamTraining("pageTitle", { title: t("title") })
            : t("title")
        }
        slug={slug}
        variant={variant}
        titleAction={help}
        correctCount={0}
        totalCount={0}
        challengeRules={{ timeLimit, mistakeLimit }}
        maxWidth={maxWidth}
        // 本体は常に「わからない」を持つ（生成待ちの間は押せない）。同じ行を
        // 押せない状態で置き、盤面の下の高さを揃える
        onReveal={noop}
        revealDisabled
        hasSubmitButton={hasSubmitButton}
      >
        <PlayBoardSkeleton
          boardHeight={BOARD_HEIGHT_BY_SLUG[slug] ?? "scoreExam"}
        />
      </TrainingShell>
    );
  }

  // トレーニングも模試も包む。出題の生成・セッションのフックを持つ
  // TrainingView より外側
  return function PresentedTrainingView(props: TProps) {
    return (
      <HandPresentationProvider fallback={<TrainingFallback />}>
        <TrainingView {...props} />
      </HandPresentationProvider>
    );
  };
}
