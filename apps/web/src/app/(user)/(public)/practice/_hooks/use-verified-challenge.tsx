"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import type { ClockReading } from "@mahjong-scoring/features/session/use-timed-session";
// Server Actions は呼ぶ時に解決し、ローカルの練習盤面はサーバー実装を評価しない。
const actions = () => import("../../../../../lib/challenge/actions");
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { useRuleSettingsStore } from "../../../../_hooks/use-rule-settings-store";
import { PracticePlayLoadingFallback } from "../_components/practice-play-loading-fallback";
import { BOARD_HEIGHT_BY_SLUG } from "../_lib/board-area-height";
import { readVariantFromLocation } from "../_lib/variant-param";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";

interface VerifiedChallenge {
  readonly id: string;
  readonly question: ChallengeQuestion;
  readonly advance: () => void;
  /**
   * 回答をサーバーへ送る。送れたら true、通信中・フィードバック中・
   * 時間切れ後で受け付けなかったら false
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
  children,
}: {
  readonly slug: PracticeMenuSlug;
  readonly children: ReactNode;
}) {
  const t = useTranslations("challenge");
  const menu = practiceMenuBySlug(slug);
  const tMenu = useTranslations(menu.namespace);
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<{
    id: string;
    question: ChallengeQuestion;
    sequence: number;
  }>();
  const [mode, setMode] = useState<"loading" | "ready" | "anonymous" | "error">(
    "loading",
  );
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
  const restart = useCallback(() => {
    expiring.current = false;
    serverExpired.current = false;
    setBusy(false);
    setGrading(false);
    setClock(undefined);
    next.current = undefined;
    setMode("loading");
    setGeneration((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const { menuType } = practiceMenuBySlug(slug);
    const { renfonpaiAs4Fu } = useRuleSettingsStore.getState();
    void actions()
      .then((api) =>
        api.beginChallenge(menuType, readVariantFromLocation(slug), {
          renfonpaiAs4Fu,
        }),
      )
      .then((result) => {
        if (!active) return;
        if ("attempt" in result && result.attempt) {
          setState(result.attempt);
          setMode("ready");
        } else setMode(result.error === "unauthorized" ? "anonymous" : "error");
      })
      .catch(() => {
        if (active) setMode("error");
      });
    return () => {
      active = false;
    };
  }, [slug, generation]);
  const advance = useCallback(() => {
    const following = next.current;
    if (!following) return;
    next.current = undefined;
    setState((previous) =>
      previous ? { ...previous, ...following } : previous,
    );
  }, []);
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
      pending.current = actions()
        .then((api) => api.answerChallenge(state.id, state.sequence, answer))
        .then((result) => {
          if (!result) {
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
        })
        .catch(() => setMode("error"))
        .finally(() => {
          busyRef.current = false;
          setBusy(serverExpired.current || expiring.current);
          setGrading(false);
        });
      return true;
    },
    [state],
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
      void (async () => {
        await pending.current;
        const api = await actions();
        let result = await api.revealExpiredChallenge(state.id);
        // サーバー時計と画面のタイマーの差を吸収し、早期終了を認めない。
        if (
          result &&
          "remainingMs" in result &&
          result.remainingMs !== undefined
        ) {
          const remainingMs = result.remainingMs;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, remainingMs) + 20),
          );
          result = await api.revealExpiredChallenge(state.id);
        }
        if (!result || !("question" in result) || !result.question) {
          setMode("error");
          return;
        }
        // フィードバック中は、まだ表示していない次問を結果に足さない。
        if (!next.current) unanswered.current?.(result.question);
        onExpired();
      })().catch(() => setMode("error"));
    },
    [state],
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
