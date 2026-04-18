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
 * - `{ ok: true }`: 成功（既に同じ状態でも冪等に true）
 * - `{ ok: false, skipped: 'anonymous' }`: 未ログインユーザー（静かにスキップ）
 * - `{ ok: false, skipped: 'invalid-slug' }`: curriculum に存在しない slug
 */
export type MarkActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly skipped: 'anonymous' | 'invalid-slug' };

/**
 * 指定章を読了済みとしてマークする Server Action。
 * 章読了マーク
 *
 * - 不正な slug は `skipped: 'invalid-slug'` で拒否
 * - 未認証は `skipped: 'anonymous'` で静かにスキップ
 * - 既に読了済みでも `ON CONFLICT DO NOTHING` で冪等
 *
 * @param slug 対象章のスラッグ
 */
export async function markChapterRead(slug: string): Promise<MarkActionResult> {
  if (!isCurriculumChapterSlug(slug)) {
    return { ok: false, skipped: 'invalid-slug' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, skipped: 'anonymous' };
  }

  await db
    .insert(learnChapterReads)
    .values({ userId: user.id, chapterSlug: slug })
    .onConflictDoNothing();

  revalidatePath('/learn');
  revalidatePath(`/learn/${slug}`);
  return { ok: true };
}
