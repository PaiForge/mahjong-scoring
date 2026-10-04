"use server";

import { isLessonSlug } from "@mahjong-scoring/features/lessons/registry";

import { fetchCompletedLessonSlugs } from "../_lib/progress";

/**
 * レッスンを完了済みかを返す Server Action
 * レッスン完了状態取得
 *
 * レッスンのページは静的生成なので、ユーザーごとの完了をページに焼き込め
 * ない。クライアント側（`useLessonCompletion`）がログイン確認後にこれを
 * 呼んで済みの印を出す（章の `getChapterReadState` と同じ形）。
 * 未認証・不正な slug は false。
 *
 * @param slug 対象レッスンのスラッグ
 */
export async function getLessonCompletionState(slug: string): Promise<boolean> {
  if (!isLessonSlug(slug)) return false;
  return (await fetchCompletedLessonSlugs()).has(slug);
}
