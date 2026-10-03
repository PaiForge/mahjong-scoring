"use server";

import { revalidatePath } from "next/cache";

import { getOptionalVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonCompletions } from "@/lib/db/schema";

import { isLessonSlug } from "@mahjong-scoring/features/lessons/registry";

/**
 * レッスン完了 Server Action の戻り値
 * レッスン完了結果
 *
 * 章読了（`markChapterRead`）と命名・構造を揃えている。
 *
 * - `{ success: true }`: 認証済みユーザーによる保存成功（既に完了済みでも冪等に true）
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」。レッスンは未ログインでも最後まで
 *   受けられ、残らないのは完了の印だけ
 * - `{ success: false, error: 'invalid_slug' }`: レジストリに存在しない slug
 */
export type CompleteLessonResult =
  | { readonly success: true }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: "invalid_slug" };

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

  await db
    .insert(lessonCompletions)
    .values({ userId: user.id, lessonSlug: slug })
    .onConflictDoNothing();

  // 完了を読むのはダッシュボードの「次の一歩」と道場の行程。レッスンページ
  // 自体は静的で完了状態を持たないため捨てない
  revalidatePath("/dashboard");
  revalidatePath("/dojo");
  return { success: true };
}
