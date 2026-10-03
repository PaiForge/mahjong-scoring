"use server";

import { revalidatePath } from "next/cache";

import { getOptionalVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonCompletions } from "@/lib/db/schema";

import {
  isLessonSlug,
  type LessonSlug,
} from "@mahjong-scoring/features/lessons/registry";

/**
 * レッスン完了 Server Action の戻り値
 * レッスン完了結果
 *
 * 章読了（`markChapterRead`）と命名・構造を揃えている。
 *
 * - `{ success: true }`: 認証済みユーザーによる保存成功（既に完了済みでも冪等に true）
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」。レッスンは未ログインでも最後まで
 *   受けられ、残らないのは完了の印だけ。クライアントは完了を端末に預け、
 *   ログイン後のホームで同期する
 * - `{ success: false, error: 'invalid_slug' }`: レジストリに存在しない slug
 */
export type CompleteLessonResult =
  | { readonly success: true }
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
      readonly completed: readonly LessonSlug[];
      readonly rejected: readonly string[];
    }
  | { readonly success: true; readonly skipped: "anonymous" };

/**
 * 認証済みユーザーの完了を冪等に記録し、完了を読む画面を捨てる
 *
 * 完了を読むのはダッシュボードの「次の一歩」と道場の行程。レッスンページ
 * 自体は静的で完了状態を持たないため捨てない。
 */
async function recordCompletions(
  userId: string,
  slugs: readonly LessonSlug[],
): Promise<void> {
  if (slugs.length === 0) return;
  await db
    .insert(lessonCompletions)
    .values(slugs.map((lessonSlug) => ({ userId, lessonSlug })))
    .onConflictDoNothing();

  revalidatePath("/dashboard");
  revalidatePath("/dojo");
}

/**
 * レッスンを完了済みとして記録する Server Action
 * レッスン完了記録
 *
 * 確認問題を最後まで解いた時点でクライアント（`LessonView`）が呼ぶ。
 * 正答数は受け取らない — 残すのは「終えた」という事実だけで、間違えた
 * 問題もその場で解説を読んで進める設計のため（`lesson_completions` の
 * TSDoc 参照）。
 *
 * - 不正な slug は `{ success: false, error: 'invalid_slug' }` で拒否
 * - 未認証は `{ success: true, skipped: 'anonymous' }` で静かにスキップ
 * - 既に完了済みでも `ON CONFLICT DO NOTHING` で冪等
 *
 * @param slug 対象レッスンのスラッグ
 */
export async function completeLesson(
  slug: string,
): Promise<CompleteLessonResult> {
  if (!isLessonSlug(slug)) {
    return { success: false, error: "invalid_slug" };
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    return { success: true, skipped: "anonymous" };
  }

  await recordCompletions(user.id, [slug]);
  return { success: true };
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
  const completed: LessonSlug[] = [];
  const rejected: string[] = [];
  for (const slug of new Set(slugs)) {
    if (isLessonSlug(slug)) completed.push(slug);
    else rejected.push(slug);
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    return { success: true, skipped: "anonymous" };
  }

  await recordCompletions(user.id, completed);
  return { success: true, completed, rejected };
}
