'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { learnChapterReads } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';

import { isCurriculumChapterSlug } from '../_lib/curriculum';
import type { MarkActionResult } from './mark-chapter-read';

/**
 * 指定章の読了マークを解除する Server Action。
 * 章読了解除
 *
 * - 不正な slug は `{ success: false, error: 'invalid-slug' }` で拒否
 * - 未認証は `{ success: true, skipped: 'anonymous' }` で静かにスキップ
 * - 該当行がなくても `{ success: true }` を返す（冪等）
 *
 * @param slug 対象章のスラッグ
 */
export async function unmarkChapterRead(slug: string): Promise<MarkActionResult> {
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
    .delete(learnChapterReads)
    .where(
      and(
        eq(learnChapterReads.userId, user.id),
        eq(learnChapterReads.chapterSlug, slug),
      ),
    );

  revalidatePath('/learn');
  revalidatePath(`/learn/${slug}`);
  return { success: true };
}
