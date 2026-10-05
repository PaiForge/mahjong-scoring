import "server-only";

import { eq } from "drizzle-orm";

import { getOptionalUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonCompletions } from "@/lib/db/schema";

/**
 * 認証ユーザーが完了したレッスン（章）のスラッグ集合を返す
 * 完了レッスン取得
 *
 * レッスンの目次（`/lessons`）の完了の印・黒帯への道（ダッシュボードの
 * 「次にやること」・道場の行程）の「学んだ」の印が読む。未認証なら空集合を
 * 返して呼び出し側に認証の有無を意識させない（LP や練習の説明ページから
 * 呼ばれてもエラーにしない）。
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
