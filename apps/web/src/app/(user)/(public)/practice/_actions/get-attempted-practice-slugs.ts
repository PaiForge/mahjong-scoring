"use server";

import { fetchAttemptedPractices } from "../../dashboard/_lib/attempted-practices";

/**
 * 本人が一度でもチャレンジを終えた練習の slug を返す Server Action
 * 挑戦済み練習 slug 取得
 *
 * 練習一覧は静的生成（cookie を読まない）なので、ユーザーごとの挑戦を
 * ページに焼き込めない。クライアント側（`AttemptedPracticesProvider`）が
 * ログイン確認後にこれを呼んで「挑戦済み」の印を出す。数え方は道場の
 * 「練習する」と同じ記録（`getAttemptedPracticesOf`）で、カードは練習ごと
 * なのでバリアントは問わない。未認証は空配列。
 */
export async function getAttemptedPracticeSlugs(): Promise<readonly string[]> {
  const attempts = await fetchAttemptedPractices();
  return [...new Set(attempts.map((attempt) => attempt.slug))];
}
