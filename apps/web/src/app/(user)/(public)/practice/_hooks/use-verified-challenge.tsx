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
// Server Actions は呼ぶ時に解決し、ローカルの練習盤面はサーバー実装を評価しない。
const actions = () => import("../../../../../lib/challenge/actions");
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { useRuleSettingsStore } from "../../../../_hooks/use-rule-settings-store";
import { readVariantFromLocation } from "../_lib/variant-param";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

interface VerifiedChallenge {
  readonly id: string;
  readonly question: ChallengeQuestion;
  readonly advance: () => void;
  readonly grade: (
    answer: unknown,
    onGraded: (question: ChallengeQuestion) => void,
  ) => void;
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

/**
 * サーバーの問題をメニュー固有の型として扱う唯一の境界
 * 問題の型変換境界
 *
 * サーバーは `ChallengeQuestion`（全メニューの和）で返すが、盤面は自分の
 * メニューの型しか知らない。サーバーが同じメニューの問題だけを返すことは
 * `attempts.ts` が保証しているので、ここだけで型を当てはめる。ここ以外で
 * 問題を型変換しないこと。
 */
export function asMenuQuestion<TQuestion>(
  question: ChallengeQuestion,
): TQuestion {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- サーバーが同一メニューの問題だけを返す前提をここ 1 箇所で型に写す（上の TSDoc 参照）
  return question as TQuestion;
}

/**
 * 既存の各盤面はメニュー固有の型を持つ。サーバーは同じメニューの問題だけを返す。
 * この境界以外で問題を型変換しない。トレーニングは同期のローカル採点を維持する。
 */
export function useGradeAnswer<TQuestion>() {
  const challenge = useVerifiedChallenge();
  return useCallback(
    (
      question: TQuestion,
      answer: unknown,
      onGraded: (question: TQuestion) => void,
    ) => {
      if (!challenge) {
        onGraded(question);
        return;
      }
      challenge.grade(answer, (graded) => onGraded(asMenuQuestion(graded)));
    },
    [challenge],
  );
}
/**
 * 採点 → 結果の記録 → 正誤の通知までを 1 つにした回答処理
 * 採点記録
 *
 * 盤面の回答の後段は「採点した問題から結果を作り、記録し、正誤と次問への
 * 進め方を `onAnswer` に渡す」で共通。結果の作り方（`toResult`）だけが盤面ごとに違う。
 *
 * @param toResult - 採点済みの問題と回答から結果を作る
 * @param handlers - 盤面の props（`onRecordResult` / `onAnswer`）と次問へ進む関数
 */
export function useGradeAndRecord<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
>(
  toResult: (question: TQuestion, answer: TAnswer) => TResult,
  {
    onRecordResult,
    onAnswer,
    advance,
  }: {
    readonly onRecordResult?: (result: TResult) => void;
    readonly onAnswer: (correct: boolean, onNext: () => void) => void;
    readonly advance: () => void;
  },
) {
  const gradeAnswer = useGradeAnswer<TQuestion>();
  return useCallback(
    (question: TQuestion, answer: TAnswer) => {
      gradeAnswer(question, answer, (gradedQuestion) => {
        const result = toResult(gradedQuestion, answer);
        onRecordResult?.(result);
        onAnswer(result.outcome === AnswerOutcome.Correct, advance);
      });
    },
    [gradeAnswer, toResult, onRecordResult, onAnswer, advance],
  );
}
/** 同一メニューに束縛されたサーバー問題を盤面へ渡す。 */
export function useVerifiedQuestion<TQuestion>():
  { question: TQuestion; advance: () => void } | undefined {
  const challenge = useVerifiedChallenge();
  return challenge
    ? {
        question: asMenuQuestion<TQuestion>(challenge.question),
        advance: challenge.advance,
      }
    : undefined;
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
    (answer: unknown, onGraded: (question: ChallengeQuestion) => void) => {
      if (
        !state ||
        busyRef.current ||
        next.current ||
        expiring.current ||
        serverExpired.current
      )
        return;
      busyRef.current = true;
      setBusy(true);
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
          onGraded(result.answered);
        })
        .catch(() => setMode("error"))
        .finally(() => {
          busyRef.current = false;
          setBusy(serverExpired.current || expiring.current);
        });
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
  if (mode === "loading")
    return (
      <p role="status" className="p-6 text-center">
        {t("preparing")}
      </p>
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
        pause,
        settled,
        restart,
        expire,
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
    </Context.Provider>
  );
}
