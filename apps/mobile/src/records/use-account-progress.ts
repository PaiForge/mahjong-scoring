import { useCallback, useMemo } from "react";
import {
  isCurriculumChapterSlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import type {
  BuildJourneyInput,
  PracticeAttempt,
} from "@mahjong-scoring/features/journey/journey";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { useAuth } from "../auth/use-auth";
import {
  useCompletedLessonSlugs,
  useLessonCompletionStore,
} from "../hooks/use-lesson-completion-store";
import { useAttemptedPractices } from "../hooks/use-practice-attempt-store";
import { addPendingLessons, recordsOf } from "./account-records";
import { syncAccountRecords, useServerProgressStore } from "./account-sync";
import {
  updateAccountRecords,
  useAccountRecordsStore,
} from "./use-account-records-store";

const NO_RANKS: readonly RankSlug[] = [];
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];
const NO_LESSONS: readonly string[] = [];

/** ログイン中のユーザー。ゲスト（読み込み中を含む）なら undefined */
function useSignedInUserId(): string | undefined {
  const { status, user } = useAuth();
  return status === "signedIn" ? user?.id : undefined;
}

/** サーバーから読んだ、今のユーザーの進み具合（まだ読めていなければ undefined） */
function useServerProgress(
  userId: string | undefined,
): BuildJourneyInput | undefined {
  return useServerProgressStore((state) =>
    userId !== undefined && state.userId === userId ? state.input : undefined,
  );
}

/** 今のユーザーの未送信のレッスン完了 */
function usePendingLessons(userId: string | undefined): readonly string[] {
  return useAccountRecordsStore((state) =>
    userId === undefined ? NO_LESSONS : recordsOf(state, userId).pendingLessons,
  );
}

/**
 * 完了したレッスンの集合
 * 完了レッスン取得
 *
 * ログイン中はサーバーの記録と未送信の和集合。ゲストは端末のゲストの記録。
 * ログイン中にゲストの記録は混ぜない（取り込みは `importGuestLessons` が
 * 1 度だけ未送信へ移して行う）。
 */
export function useCompletedLessons(): ReadonlySet<CurriculumChapterSlug> {
  const userId = useSignedInUserId();
  const guest = useCompletedLessonSlugs();
  const server = useServerProgress(userId)?.completedLessonSlugs;
  const pending = usePendingLessons(userId);
  return useMemo(() => {
    if (userId === undefined) return guest;
    return new Set(
      [...(server ?? []), ...pending].filter(isCurriculumChapterSlug),
    );
  }, [userId, guest, server, pending]);
}

/**
 * そのレッスンを完了しているか
 * レッスン完了判定
 */
export function useLessonDone(slug: CurriculumChapterSlug): boolean {
  return useCompletedLessons().has(slug);
}

/**
 * レッスンを完了にする関数
 * レッスン完了記録
 *
 * ログイン中はそのユーザーの未送信へ積んでから送る（送れなければ次の
 * 同期で送り直す）。ゲストは端末のゲストの記録へ。
 */
export function useMarkLessonCompleted(): (
  slug: CurriculumChapterSlug,
) => void {
  const userId = useSignedInUserId();
  const markGuest = useLessonCompletionStore((state) => state.markCompleted);
  return useCallback(
    (slug: CurriculumChapterSlug) => {
      if (userId === undefined) {
        markGuest(slug);
        return;
      }
      updateAccountRecords((records) =>
        addPendingLessons(records, userId, [slug]),
      );
      void syncAccountRecords(userId);
    },
    [userId, markGuest],
  );
}

/** 黒帯への道の材料と、端末の記録を含むか */
export interface AccountProgress {
  readonly input: BuildJourneyInput;
  /**
   * サーバーに無い「チャレンジを終えた練習」を、端末のゲストの記録から
   * 足しているか（「この端末の履歴を含みます」の表示に使う）
   */
  readonly includesDeviceAttempts: boolean;
}

function attemptKey(attempt: PracticeAttempt): string {
  return `${attempt.slug}\u0000${attempt.variant}`;
}

/**
 * 黒帯への道の材料（`buildJourney` の入力）
 * アカウント進み具合
 *
 * - レッスンの完了: {@link useCompletedLessons}
 * - チャレンジを終えた練習: ログイン中はサーバーの記録と端末のゲストの記録の
 *   和集合。ゲストの記録は案内（次にやること・行程）にだけ使い、サーバーへは
 *   送らない — 段級位や受験資格は端末の印で増やさない
 * - 段級位: ログイン中はサーバーの値。ゲストは無い
 */
export function useAccountProgress(): AccountProgress {
  const userId = useSignedInUserId();
  const server = useServerProgress(userId);
  const completedLessonSlugs = useCompletedLessons();
  const deviceAttempts = useAttemptedPractices();
  const serverAttempts = server?.attemptedPractices ?? NO_ATTEMPTS;
  const achievedRankSlugs = server?.achievedRankSlugs ?? NO_RANKS;
  return useMemo(() => {
    const known = new Set(serverAttempts.map(attemptKey));
    const deviceOnly =
      userId === undefined
        ? NO_ATTEMPTS
        : deviceAttempts.filter((attempt) => !known.has(attemptKey(attempt)));
    return {
      input: {
        completedLessonSlugs,
        attemptedPractices:
          userId === undefined
            ? deviceAttempts
            : [...serverAttempts, ...deviceOnly],
        achievedRankSlugs,
      },
      includesDeviceAttempts: deviceOnly.length > 0,
    };
  }, [
    userId,
    completedLessonSlugs,
    deviceAttempts,
    serverAttempts,
    achievedRankSlugs,
  ]);
}
