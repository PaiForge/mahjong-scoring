"use client";
import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import type { ClockReading } from "@mahjong-scoring/features/session/use-timed-session";
import { withRetries } from "@mahjong-scoring/features/session/with-retries";
// Server Actions は呼ぶ時に解決し、ローカルの練習盤面はサーバー実装を評価しない。
const actions = () => import("../../../../../lib/challenge/actions");
import type {
  AnswerChallengeResponse,
  RevealExpiredResponse,
} from "../../../../../lib/challenge/actions";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { PracticePlayLoadingFallback } from "../_components/practice-play-loading-fallback";
import { BOARD_HEIGHT_BY_SLUG } from "../_lib/board-area-height";
import { isRetryableChallengeFailure } from "../_lib/challenge-failure-policy";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";
import { useChallengeStart } from "./use-challenge-start";

/**
 * 1 回の送信の結果。Action が投げた例外（通信の失敗・Server Action の
 * 枠組みの失敗）も応答と同じ形に畳み、送り直しの判定に掛ける
 */
type Sent<T> = T | { readonly thrown: unknown };

/** Action を 1 回呼び、例外は結果に畳む */
async function sendOnce<T>(send: () => Promise<T>): Promise<Sent<T>> {
  try {
    return await send();
  } catch (error: unknown) {
    return { thrown: error };
  }
}

/**
 * 送り直してよい結果か（例外か、送り直してよい失敗）
 *
 * 分け方は `challenge-failure-policy.ts`。成功の応答はどれも `error` も
 * `thrown` も持たない。
 */
function shouldResend(
  outcome: Sent<AnswerChallengeResponse | RevealExpiredResponse>,
): boolean {
  if ("thrown" in outcome) return true;
  return "error" in outcome && isRetryableChallengeFailure(outcome.error);
}

/**
 * 送り直してよい失敗を、間を空けて数回送り直す（`RETRY_DELAYS_MS`）
 *
 * 尽きても送り直してよい結果（まだ通らない）か、サーバーが答えを出した結果
 * （成功・受け付けられなかった）を返す。
 */
function sendWithRetries<
  T extends AnswerChallengeResponse | RevealExpiredResponse,
>(send: () => Promise<T>): Promise<Sent<T>> {
  return withRetries(() => sendOnce(send), shouldResend);
}

interface VerifiedChallenge {
  readonly id: string;
  readonly question: ChallengeQuestion;
  readonly advance: () => void;
  /**
   * 回答をサーバーへ送る。送れたら true、通信中・フィードバック中・
   * 時間切れ後で受け付けなかったら false
   *
   * 一時的な失敗（回数制限・認証サーバーの不通・DB の失敗・通信の例外）は
   * 同じ番号・同じ回答を間を空けて数回送り直す（分け方は
   * `challenge-failure-policy.ts`、間隔は結果送信と同じ `withRetries`）。
   * サーバーは直前の問題への同じ回答の再送に採点し直さず同じ応答を返す
   * （`decideChallengeAnswer` の `replay`）ので、応答だけが失われた回答を
   * 送り直しても二重に数えない。送り直す間も `isGrading` のままで、画面の
   * 時計は止まり選択肢は押せない。
   *
   * 送り直しの間の時間は競技時間に数えられる。サーバーの時計は受付から
   * 応答までと固定の猶予（`RESPONSE_GRACE_MS`）しか止まらず、弾かれた要求は
   * 行に触れないので、通るまでの間はサーバーでは進み続ける。画面の時計は
   * 止めているので、通った応答の `clock` に合わせ直すときにその分だけ前へ
   * 跳ぶ。これは受け入れる（2026-10）。巻き戻すには「最初に送った時刻」を
   * クライアントの申告で受け取るしかなく、それは猶予を固定値にした理由
   * （申告は信用しない）と同じ理由で採らない。自動の送り直しは合計 3.5 秒
   * ほどで、枠（人の操作では届かない値）か障害のときにしか起きない。アプリも
   * 同じ（届かなかった間もサーバーの時計は進む）
   */
  readonly grade: (
    answer: unknown,
    onGraded: (question: ChallengeQuestion) => void,
  ) => boolean;
  /** 回答を送ってサーバーの採点を待っている間 true。この間は時計を止める */
  readonly isGrading: boolean;
  /**
   * 直近の採点時点のサーバーの経過時間。盤面の時計をこれに合わせ直す
   *
   * サーバーは回答を受け取ってから応答を組むまでの処理時間と、その後の
   * 固定の猶予（`transitions.ts` の `RESPONSE_GRACE_MS`）の間、時計を
   * 止める。画面側は押してから応答が届くまで止める（`isGrading`）。応答の
   * たびにこの値へ合わせ直すので、ずれは直近の 1 問分（往復の片道）に
   * 留まり積み上がらない。`sequence` は同じ経過時間が続いても合わせ直しを
   * 起こすための識別子
   */
  readonly clock: ClockReading | undefined;
  readonly pause: (paused: boolean) => Promise<boolean>;
  readonly settled: () => Promise<void>;
  readonly restart: () => void;
  readonly expire: (onExpired: () => void) => void;
  readonly registerUnanswered: (
    callback: ((question: ChallengeQuestion) => void) | undefined,
  ) => void;
}
const Context = createContext<VerifiedChallenge | undefined>(undefined);
/** 記録対象の挑戦だけが提供するサーバー採点コンテキスト。 */
export function useVerifiedChallenge() {
  return useContext(Context);
}

/** 開始完了後に盤面をマウントし、その時点からカウントダウンを動かす。 */
export function VerifiedChallengeProvider({
  slug,
  maxWidth,
  children,
}: {
  readonly slug: PracticeMenuSlug;
  /** 開始を待つ間のスケルトンの列幅。本体の `ChallengeShell` と同じ値を渡す */
  readonly maxWidth?: string;
  readonly children: ReactNode;
}) {
  const t = useTranslations("challenge");
  const menu = practiceMenuBySlug(slug);
  const tMenu = useTranslations(menu.namespace);
  const {
    mode,
    setMode,
    state,
    setState,
    generation,
    restart: restartStart,
  } = useChallengeStart(slug);
  const [busy, setBusy] = useState(false);
  const [grading, setGrading] = useState(false);
  const [clock, setClock] = useState<ClockReading | undefined>(undefined);
  const next = useRef<
    { question: ChallengeQuestion; sequence: number } | undefined
  >(undefined);
  const pending = useRef<Promise<void> | undefined>(undefined);
  const busyRef = useRef(false);
  const serverExpired = useRef(false);
  const expiring = useRef(false);
  const unanswered = useRef<
    ((question: ChallengeQuestion) => void) | undefined
  >(undefined);
  const registerUnanswered = useCallback(
    (callback: ((question: ChallengeQuestion) => void) | undefined) => {
      unanswered.current = callback;
    },
    [],
  );
  /** 採点の途中の状態を捨てて、開始からやり直す */
  const restart = useCallback(() => {
    expiring.current = false;
    serverExpired.current = false;
    setBusy(false);
    setGrading(false);
    setClock(undefined);
    next.current = undefined;
    restartStart();
  }, [restartStart]);
  const advance = useCallback(() => {
    const following = next.current;
    if (!following) return;
    next.current = undefined;
    setState((previous) =>
      previous ? { ...previous, ...following } : previous,
    );
  }, [setState]);
  const grade = useCallback(
    (
      answer: unknown,
      onGraded: (question: ChallengeQuestion) => void,
    ): boolean => {
      if (
        !state ||
        busyRef.current ||
        next.current ||
        expiring.current ||
        serverExpired.current
      )
        return false;
      busyRef.current = true;
      setBusy(true);
      setGrading(true);
      const { id, sequence } = state;
      const send = async (): Promise<void> => {
        const result = await sendWithRetries(async () =>
          (await actions()).answerChallenge(id, sequence, answer),
        );
        // 送り直しても通らない・受け付けられなかった: 盤面ごと止めて
        // 開始からやり直させる（この回は未確定のまま残る）
        if ("thrown" in result || "error" in result) {
          setMode("error");
          return;
        }
        if ("expired" in result) {
          serverExpired.current = true;
          return;
        }
        next.current = {
          question: result.question,
          sequence: result.sequence,
        };
        setState((previous) =>
          previous ? { ...previous, question: result.answered } : previous,
        );
        setClock({ elapsedMs: result.elapsedMs, sequence: result.sequence });
        onGraded(result.answered);
      };
      pending.current = send().finally(() => {
        busyRef.current = false;
        setBusy(serverExpired.current || expiring.current);
        setGrading(false);
      });
      return true;
    },
    [state, setMode, setState],
  );
  const pause = useCallback(
    async (paused: boolean) => {
      await pending.current;
      return state ? (await actions()).pauseChallenge(state.id, paused) : false;
    },
    [state],
  );
  const settled = useCallback(async () => {
    await pending.current;
  }, []);
  const expire = useCallback(
    (onExpired: () => void) => {
      if (expiring.current || !state) return;
      expiring.current = true;
      setBusy(true);
      const { id } = state;
      // 読むだけの Action なので、一時的な失敗は同じ挑戦 ID で読み直す
      const reveal = async () =>
        sendWithRetries(async () =>
          (await actions()).revealExpiredChallenge(id),
        );
      void (async () => {
        await pending.current;
        let result = await reveal();
        // サーバー時計と画面のタイマーの差を吸収し、早期終了を認めない。
        if ("remainingMs" in result) {
          const remainingMs = result.remainingMs;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, remainingMs) + 20),
          );
          result = await reveal();
        }
        if (!("question" in result)) {
          setMode("error");
          return;
        }
        // フィードバック中は、まだ表示していない次問を結果に足さない。
        if (!next.current) unanswered.current?.(result.question);
        onExpired();
      })();
    },
    [state, setMode],
  );
  // サーバーが挑戦を作る往復の間は、昇級試験の loading.tsx と同じ形の
  // スケルトンを出す。盤面がブラウザ内で生成されていた頃はシェルが即座に
  // 出ていたので、往復が増えてもシェルの形は先に見せ、応答が届いた瞬間に
  // 画面の丈が変わらないようにする（文章 1 行で待つと見出しが跳ぶ）
  if (mode === "loading")
    return (
      <PracticePlayLoadingFallback
        practiceTitle={tMenu("title")}
        mistakeLimit={menu.mistakeLimit}
        boardHeight={BOARD_HEIGHT_BY_SLUG[slug]}
        maxWidth={maxWidth}
      />
    );
  if (mode === "error")
    return (
      <div role="alert" className="p-6 text-center">
        <p>{t("connectionError")}</p>
        <button onClick={restart}>{t("retryConnection")}</button>
      </div>
    );
  if (mode === "anonymous") return children;
  if (!state) return undefined;
  return (
    <Context.Provider
      value={{
        ...state,
        advance,
        grade,
        isGrading: grading,
        clock,
        pause,
        settled,
        restart,
        expire,
        registerUnanswered,
      }}
    >
      {/* 盤面のフック（出題・採点・届け出）へ渡す口。盤面はこれを通してだけ
          サーバーの問題を読み、回答を送る */}
      <QuestionHostProvider
        value={{
          question: state.question,
          advance,
          grade,
          registerUnanswered,
        }}
      >
        <fieldset
          disabled={busy}
          className="min-w-0 border-0 p-0 m-0"
          key={generation}
        >
          {children}
        </fieldset>
      </QuestionHostProvider>
    </Context.Provider>
  );
}
