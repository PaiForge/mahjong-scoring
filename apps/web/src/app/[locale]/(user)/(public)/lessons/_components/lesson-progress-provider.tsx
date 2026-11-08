"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/app/_contexts/auth-context";

import { getCompletedLessonSlugs } from "../_actions/get-completed-lesson-slugs";

/**
 * 目次の 1 つの範囲（全体 / 1 つの級）で数えた本人の進み具合
 * レッスン進捗
 */
export interface LessonProgress {
  /** 本人が完了したレッスン（範囲の外の章も含む。行の完了の印に使う） */
  readonly completed: ReadonlySet<string>;
  /** 「次はここから」。範囲のレッスンを順に見て最初の未完了。全部終えていれば undefined */
  readonly nextSlug: string | undefined;
  /** 範囲のレッスンのうち完了した数（進捗バーの分子） */
  readonly completedCount: number;
  /** 範囲のレッスンの数（進捗バーの分母） */
  readonly totalCount: number;
}

/** 取得済みの完了。誰の分かを持ち、ユーザーが切り替わったら捨てる */
interface FetchedCompletions {
  readonly userId: string;
  readonly completed: ReadonlySet<string>;
}

const FetchedCompletionsContext = createContext<FetchedCompletions | undefined>(
  undefined,
);

const LessonProgressContext = createContext<LessonProgress | undefined>(
  undefined,
);

/**
 * 範囲のレッスンと完了の集合から進み具合を数える
 * 進捗算出
 *
 * 次は `lessonSlugs` の並び（order 順で渡す）で最初の未完了、分母は
 * `lessonSlugs` の数。静的 HTML（ゲストの状態）は空集合で呼んだ結果と同じに
 * なる — 次は範囲の最初のレッスン、進捗は 0。
 *
 * @param completed - 完了したレッスンのスラッグ
 * @param lessonSlugs - 範囲のレッスン（その言語で出しているものだけ、order 順）
 */
export function deriveLessonProgress(
  completed: ReadonlySet<string>,
  lessonSlugs: readonly string[],
): LessonProgress {
  return {
    completed,
    nextSlug: lessonSlugs.find((slug) => !completed.has(slug)),
    completedCount: lessonSlugs.filter((slug) => completed.has(slug)).length,
    totalCount: lessonSlugs.length,
  };
}

/**
 * 本人の完了を 1 回だけ取って配る
 * レッスン進捗プロバイダ
 *
 * `/lessons` だけが置く。目次は静的生成（cookie を読まない）なので、完了の印・
 * 進捗・「次はここから」はページに焼き込めない。ログイン（`useAuth()` の
 * `user.id`）が立ったら Server Action `getCompletedLessonSlugs()` を呼び、
 * 下の {@link LessonProgressScope} が範囲ごとに数え直して行と進捗バーを上書きする。
 *
 * `?rank=` の絞り込みはクライアントで切り替わるので、取得はこの Provider
 * （絞り込みの外）に置き、範囲の数え方だけを Scope に分ける — 全体と級の目次を
 * 行き来するたびに取り直さない。
 *
 * ゲスト・取得前・取得の失敗は何も配らない。行と進捗バーは props の値（静的
 * HTML と同じゲストの状態）のまま描く。取り終えた完了は誰の分かを持ち、別の
 * ユーザーに切り替わったら使わない（ログアウト → 別アカウントでログイン）。
 *
 * Provider の無い場所（LP・道場・試験ページ・ダッシュボード）の目次は
 * 呼び出し側の props をそのまま使う（サーバーが完了を読んで渡している）。
 */
export function LessonProgressProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [fetched, setFetched] = useState<FetchedCompletions | undefined>(
    undefined,
  );

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    getCompletedLessonSlugs().then(
      (slugs) => {
        if (cancelled) return;
        setFetched({ userId, completed: new Set(slugs) });
      },
      () => {
        // 取れなければゲストの状態（props）のまま。目次の閲覧は完了の印に依らない
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const own = fetched !== undefined && fetched.userId === userId;

  return (
    <FetchedCompletionsContext value={own ? fetched : undefined}>
      {children}
    </FetchedCompletionsContext>
  );
}

/**
 * 目次の範囲（全体 / 1 つの級）を決めて進み具合を数える
 * レッスン進捗スコープ
 *
 * 次と分母は `lessonSlugs` だけから数える。英語の目次では、英語で出している
 * レッスンだけを渡す — 「次はここから」が日本語だけの章を指したり、読めない章が
 * 分母に入って進捗が 100% にならなかったりしないように。
 *
 * {@link LessonProgressProvider} が本人の完了を取り終えたときだけ値を配る。
 *
 * @param lessonSlugs - 範囲のレッスン（その言語で出しているものだけ、order 順）
 */
export function LessonProgressScope({
  lessonSlugs,
  children,
}: {
  readonly lessonSlugs: readonly string[];
  readonly children: ReactNode;
}) {
  const fetched = useContext(FetchedCompletionsContext);
  const progress = useMemo(
    () =>
      fetched === undefined
        ? undefined
        : deriveLessonProgress(fetched.completed, lessonSlugs),
    [fetched, lessonSlugs],
  );
  return (
    <LessonProgressContext value={progress}>{children}</LessonProgressContext>
  );
}

/**
 * 本人の進み具合（取得済みで、範囲の中にいるときだけ値を持つ）
 *
 * undefined のときは呼び出し側の props（静的 HTML と同じ値）を使う。
 */
export function useLessonProgress(): LessonProgress | undefined {
  return useContext(LessonProgressContext);
}
