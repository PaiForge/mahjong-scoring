import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { learnChapterReads } from '@/lib/db/schema';
import { getOptionalUser } from '@/lib/auth';

/**
 * 認証ユーザーの読了済み章スラッグ集合を返す。
 * 読了済み章取得
 *
 * 未認証の場合は空集合を返す（LP/匿名導線で呼ばれてもエラーにしない）。
 */
export async function fetchReadChapterSlugs(): Promise<ReadonlySet<string>> {
  const user = await getOptionalUser();
  if (!user) return new Set();

  const rows = await db
    .select({ chapterSlug: learnChapterReads.chapterSlug })
    .from(learnChapterReads)
    .where(eq(learnChapterReads.userId, user.id));

  return new Set(rows.map((r) => r.chapterSlug));
}

/**
 * 指定章の読了状態を返す。未認証時は常に false。
 * 章読了判定
 *
 * @param slug 対象章のスラッグ
 */
export async function isChapterRead(slug: string): Promise<boolean> {
  const readSlugs = await fetchReadChapterSlugs();
  return readSlugs.has(slug);
}
