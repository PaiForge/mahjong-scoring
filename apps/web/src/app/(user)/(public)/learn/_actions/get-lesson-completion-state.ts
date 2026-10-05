"use server";

import { isCurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { fetchCompletedLessonSlugs } from "../_lib/lesson-progress";

/**
 * レッスン（章）を完了済みかを返す Server Action
 * レッスン完了状態取得
 *
 * レッスンのページは静的生成なので、ユーザーごとの完了をページに焼き込め
 * ない。クライアント側（`useLessonCompletion`）がログイン確認後にこれを
 * 呼んで済みの印を出す。未認証・不正な slug は false。
 *
 * @param slug 対象レッスン（章）のスラッグ
 */
export async function getLessonCompletionState(slug: string): Promise<boolean> {
  if (!isCurriculumChapterSlug(slug)) return false;
  return (await fetchCompletedLessonSlugs()).has(slug);
}
