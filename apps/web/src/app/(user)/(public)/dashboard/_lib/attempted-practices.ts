import "server-only";

import { getOptionalUser } from "@/lib/auth";
import { getAttemptedPracticesOf } from "@/lib/journey/progress";
import type { PracticeAttempt } from "@mahjong-scoring/features/journey/journey";

/**
 * 一度でも挑戦したことのある練習の土俵（slug × バリアント）を返す。
 * 挑戦済み練習取得
 *
 * cookie のセッションの本人について `getAttemptedPracticesOf` を引く
 * （数え方はそちらの TSDoc）。未認証の場合は空配列を返す。
 */
export async function fetchAttemptedPractices(): Promise<
  readonly PracticeAttempt[]
> {
  const user = await getOptionalUser();
  if (!user) return [];
  return getAttemptedPracticesOf(user.id);
}
