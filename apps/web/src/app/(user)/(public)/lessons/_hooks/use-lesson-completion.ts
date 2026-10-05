"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/app/_contexts/auth-context";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { getLessonCompletionState } from "../_actions/get-lesson-completion-state";

/** 取得済みの完了状態。誰の分かを持ち、ユーザーが切り替わったら捨てる */
interface FetchedCompletion {
  readonly userId: string;
  readonly completed: boolean;
}

/**
 * 本人がレッスン（章）を完了済みかを取る
 * レッスン完了状態
 *
 * レッスンのページは静的生成（cookie を読まない）なので、ログインを
 * 確かめてから Server Action で取る。未取得・未ログインは false。
 * その場で終えて記録できたら `markCompleted` で済みにする — 取り直さなくても、
 * 記録が成功した事実だけで済みと言える。確認問題の進行（`LessonView`）と
 * 章末の完了ボタン（`ChapterCompleteButton`）が共有する。
 */
export function useLessonCompletion(slug: CurriculumChapterSlug): {
  readonly completed: boolean;
  /** 本人の完了状態を取り終えたか（未ログインは常に false） */
  readonly fetched: boolean;
  readonly markCompleted: () => void;
} {
  const { user } = useAuth();
  const userId = user?.id;
  const [fetched, setFetched] = useState<FetchedCompletion | undefined>(
    undefined,
  );

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    getLessonCompletionState(slug).then((completed) => {
      if (cancelled) return;
      // 取得中にこのページで記録できていたら、その済みを取り消さない
      setFetched((prev) =>
        prev?.userId === userId && prev.completed
          ? prev
          : { userId, completed },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [userId, slug]);

  const markCompleted = useCallback(() => {
    if (userId === undefined) return;
    setFetched({ userId, completed: true });
  }, [userId]);

  // 別のユーザーの分は使わない（ログアウト → 別アカウントでログインした場合）
  const isOwn = fetched !== undefined && fetched.userId === userId;
  const completed = isOwn && fetched.completed;

  return { completed, fetched: isOwn, markCompleted };
}
