import "server-only";

import { eq } from "drizzle-orm";

import { getOptionalUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonCompletions } from "@/lib/db/schema";

/**
 * 認証ユーザーが完了したレッスンのスラッグ集合を返す
 * 完了レッスン取得
 *
 * 黒帯への道（ダッシュボードの「次にやること」・道場の行程）が章の「学んだ」の
 * 印を組むのに使う。章の読了（`fetchReadChapterSlugs`）と同じく、未認証なら
 * 空集合を返して呼び出し側に認証の有無を意識させない。
 */
export async function fetchCompletedLessonSlugs(): Promise<
  ReadonlySet<string>
> {
  const user = await getOptionalUser();
  if (!user) return new Set();

  const rows = await db
    .select({ lessonSlug: lessonCompletions.lessonSlug })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, user.id));

  return new Set(rows.map((row) => row.lessonSlug));
}
