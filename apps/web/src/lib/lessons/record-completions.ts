import "server-only";

import {
  isCurriculumChapterSlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";

import { db } from "../db";
import { lessonCompletions } from "../db/schema";
import { lockAccountForWrite } from "../users/account-write-lock";

/**
 * クライアントが送ってきたスラッグを、カリキュラムにある章とそれ以外に分ける
 * レッスンスラッグ仕分け
 *
 * 重複は 1 つにまとめる。
 */
export function partitionLessonSlugs(slugs: readonly string[]): {
  readonly completed: readonly CurriculumChapterSlug[];
  readonly rejected: readonly string[];
} {
  const completed: CurriculumChapterSlug[] = [];
  const rejected: string[] = [];
  for (const slug of new Set(slugs)) {
    if (isCurriculumChapterSlug(slug)) completed.push(slug);
    else rejected.push(slug);
  }
  return { completed, rejected };
}

/**
 * ユーザーのレッスンの完了を冪等に記録する
 * レッスン完了書き込み
 *
 * 退会を受け付けた後には書かない（入口の確認を通った後に退会が受け付け
 * られても、`lockAccountForWrite` が直列にする）。そのとき false を返す。
 * 画面のキャッシュを捨てるのは呼び出し側（web の Server Action）の役目。
 */
export async function recordLessonCompletions(
  userId: string,
  slugs: readonly CurriculumChapterSlug[],
): Promise<boolean> {
  if (slugs.length === 0) return true;
  return db.transaction(async (tx) => {
    if (!(await lockAccountForWrite(tx, userId))) return false;
    await tx
      .insert(lessonCompletions)
      .values(slugs.map((lessonSlug) => ({ userId, lessonSlug })))
      .onConflictDoNothing();
    return true;
  });
}
