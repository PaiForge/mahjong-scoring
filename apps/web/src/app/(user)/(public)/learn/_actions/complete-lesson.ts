"use server";

import { revalidatePath } from "next/cache";

import { getOptionalVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonCompletions } from "@/lib/db/schema";
import { logExternalError } from "@/lib/log-error";

import {
  isCurriculumChapterSlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  isQuizLessonSlug,
  type QuizLessonSlug,
} from "@mahjong-scoring/features/lessons/registry";

import { fetchJourneyInput } from "../_lib/journey-input";
import { lessonFollowUp, type LessonFollowUp } from "../_lib/lesson-follow-up";

/**
 * レッスン完了 Server Action の戻り値
 * レッスン完了結果
 *
 * - `{ success: true, followUp? }`: 認証済みユーザーによる保存成功（既に完了済み
 *   でも冪等に true）。`followUp` は本人の進み具合から求めた続き（次の一歩と
 *   級の進み具合。`LessonFollowUp`）で、確認問題の完了画面が道筋の順の一歩の
 *   代わりに使う。確認問題を持たないレッスン・進み具合の読み取りに失敗した
 *   ときは無く、完了画面は道筋の順の一歩のまま
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」。レッスンは未ログインでも最後まで
 *   受けられ、残らないのは完了の印だけ。クライアントは完了を端末に預け、
 *   ログイン後のホームで同期する
 * - `{ success: false, error: 'invalid_slug' }`: カリキュラムに存在しない slug
 */
export type CompleteLessonResult =
  | { readonly success: true; readonly followUp?: LessonFollowUp }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: "invalid_slug" };

/**
 * 複数レッスンの完了を同期する Server Action の戻り値
 * レッスン同期結果
 *
 * - `{ success: true, completed, rejected }`: 認証済み。`completed` は記録した
 *   （既に記録済みのものも含む）スラッグ、`rejected` はレジストリに無く
 *   捨てたもの。クライアントはどちらも預かりから外す
 * - `{ success: true, skipped: 'anonymous' }`: 未ログイン。預かりはそのまま残す
 */
export type CompleteLessonsResult =
  | {
      readonly success: true;
      readonly completed: readonly CurriculumChapterSlug[];
      readonly rejected: readonly string[];
    }
  | { readonly success: true; readonly skipped: "anonymous" };

/**
 * 認証済みユーザーの完了を冪等に記録し、完了を読む画面を捨てる
 *
 * 完了を読むのはレッスンの目次・ダッシュボードの「次にやること」・道場の行程。
 * レッスンページ自体は静的で完了状態を持たないため捨てない。
 */
async function recordCompletions(
  userId: string,
  slugs: readonly CurriculumChapterSlug[],
): Promise<void> {
  if (slugs.length === 0) return;
  await db
    .insert(lessonCompletions)
    .values(slugs.map((lessonSlug) => ({ userId, lessonSlug })))
    .onConflictDoNothing();

  revalidatePath("/learn");
  revalidatePath("/dashboard");
  revalidatePath("/dojo");
}

/**
 * レッスン（章）を完了済みとして記録する Server Action
 * レッスン完了記録
 *
 * 確認問題を最後まで解いた時点でクライアント（`LessonView`）が、確認問題を
 * 持たないレッスンでは章末の完了ボタン（`ChapterCompleteButton`）が呼ぶ。
 * 確認問題を持つレッスンでは、記録できたら本人の進み具合から求めた続き
 * （次の一歩・級の進み具合）も返す — レッスンのページは静的で進み具合を
 * 知らないため。進み具合は 1 回だけ読み、完了画面のボタンと「昇級試験まで」の
 * 両方に使う。正答数は受け取らない — 残すのは「終えた」という事実だけで、
 * 間違えた問題もその場で解説を読んで進める設計のため（`lesson_completions` の
 * TSDoc 参照）。
 *
 * - 不正な slug は `{ success: false, error: 'invalid_slug' }` で拒否
 * - 未認証は `{ success: true, skipped: 'anonymous' }` で静かにスキップ
 * - 既に完了済みでも `ON CONFLICT DO NOTHING` で冪等
 *
 * @param slug 対象レッスン（章）のスラッグ
 */
export async function completeLesson(
  slug: string,
): Promise<CompleteLessonResult> {
  if (!isCurriculumChapterSlug(slug)) {
    return { success: false, error: "invalid_slug" };
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    return { success: true, skipped: "anonymous" };
  }

  await recordCompletions(user.id, [slug]);
  if (!isQuizLessonSlug(slug)) return { success: true };
  const followUp = await followUpFor(user.id, slug);
  return followUp === undefined
    ? { success: true }
    : { success: true, followUp };
}

/**
 * 記録した直後の本人に示す続き（次の一歩・級の進み具合）
 *
 * 記録は済んでいるので、ここで失敗しても保存の失敗にはしない（完了画面は
 * 道筋の順の一歩に落ちるだけ）。進み具合は記録のあとに読むので、終えた
 * レッスンも済みとして数えられる。
 */
async function followUpFor(
  userId: string,
  slug: QuizLessonSlug,
): Promise<LessonFollowUp | undefined> {
  try {
    return lessonFollowUp(slug, await fetchJourneyInput(userId));
  } catch (error: unknown) {
    logExternalError(
      "completeLesson",
      "レッスンの続きを求められなかった",
      error,
    );
    return undefined;
  }
}

/**
 * 端末に預けてあったレッスンの完了をまとめて記録する Server Action
 * レッスン完了同期
 *
 * 登録前（未ログイン）に終えたレッスンや、保存に失敗して端末に残った完了を、
 * ログイン済みのホーム（`PendingLessonSync`）が送ってくる。スラッグは
 * クライアント由来なのでレジストリで検証し、無いものは `rejected` に返して
 * 捨てさせる。書くのは `lesson_completions` だけで、段級位や試験の合否には
 * 触らない（それらは `submitExamResult` だけが付与する）。
 *
 * 誰の完了として記録するかは cookie のセッション（`getOptionalVerifiedUser`）
 * だけで決める。クライアントが名乗る id は受け取らない。
 *
 * @param slugs 預かっていたレッスンのスラッグ
 */
export async function completeLessons(
  slugs: readonly string[],
): Promise<CompleteLessonsResult> {
  const completed: CurriculumChapterSlug[] = [];
  const rejected: string[] = [];
  for (const slug of new Set(slugs)) {
    if (isCurriculumChapterSlug(slug)) completed.push(slug);
    else rejected.push(slug);
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    return { success: true, skipped: "anonymous" };
  }

  await recordCompletions(user.id, completed);
  return { success: true, completed, rejected };
}
