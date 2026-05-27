'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { learnChapterReads } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';

import { isCurriculumChapterSlug } from '../_lib/curriculum';

/**
 * 読了マーク系 Server Action の戻り値
 * 読了アクション結果
 *
 * `savePracticeResult` と命名・構造を揃えている。
 *
 * - `{ success: true }`: 認証済みユーザーによる保存／解除成功
 *   （既に同じ状態でも冪等に true）
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表し、呼び出し側はサインインページへ誘導する。
 * - `{ success: false, error: 'invalid-slug' }`: curriculum に存在しない slug
 */
export type MarkActionResult =
  | { readonly success: true }
  | { readonly success: true; readonly skipped: 'anonymous' }
  | { readonly success: false; readonly error: 'invalid-slug' };

/**
 * 指定章を読了済みとしてマークする Server Action。
 * 章読了マーク
 *
 * - 不正な slug は `{ success: false, error: 'invalid-slug' }` で拒否
 * - 未認証は `{ success: true, skipped: 'anonymous' }` で静かにスキップ
 * - 既に読了済みでも `ON CONFLICT DO NOTHING` で冪等
 *
 * @param slug 対象章のスラッグ
 */
export async function markChapterRead(slug: string): Promise<MarkActionResult> {
  if (!isCurriculumChapterSlug(slug)) {
    return { success: false, error: 'invalid-slug' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: true, skipped: 'anonymous' };
  }

  await db
    .insert(learnChapterReads)
    .values({ userId: user.id, chapterSlug: slug })
    .onConflictDoNothing();

  revalidatePath('/learn');
  revalidatePath(`/learn/${slug}`);
  return { success: true };
}
