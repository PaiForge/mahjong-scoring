"use server";

import { fetchCompletedLessonSlugs } from "../_lib/lesson-progress";

/**
 * 本人が完了したレッスン（章）のスラッグを返す Server Action
 * 完了レッスン一覧取得
 *
 * レッスンの目次（`/lessons`）は静的生成で、ユーザーごとの完了をページに
 * 焼き込めない（cookie を読むと目次が動的ルートに戻る）。クライアントの
 * `LessonProgressProvider` がログインを確かめてからこれを 1 回呼び、完了の印・
 * 進捗・「次はここから」を上書きする。1 章分だけを返す
 * `getLessonCompletionState` と違い、目次の全行を 1 往復で埋めるため全件を返す。
 *
 * Server Action の戻り値として渡せる形にするため、集合ではなく配列で返す。
 * 未認証は空配列。
 */
export async function getCompletedLessonSlugs(): Promise<string[]> {
  return [...(await fetchCompletedLessonSlugs())];
}
