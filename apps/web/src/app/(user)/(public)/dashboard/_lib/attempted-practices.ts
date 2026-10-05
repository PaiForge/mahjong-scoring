import "server-only";

import { eq } from "drizzle-orm";

import { getOptionalUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PracticeAttempt } from "@mahjong-scoring/features/journey/journey";
import {
  isPracticeMenuType,
  menuTypeToSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { challengeBestScores } from "@/lib/db/schema";

/**
 * 一度でも挑戦したことのある練習の土俵（slug × バリアント）を返す。
 * 挑戦済み練習取得
 *
 * @remarks
 * `challenge_best_scores` は (userId, menuType, leaderboardKey) に 1 行なので、
 * 「その土俵をやったことがあるか」は追記ログ（`challenge_results`）を走査せずに
 * ここから引ける。`leaderboard_key` はバリアントのキーそのもの（設定を持たない
 * 練習は `default`）で、変換せずそのまま `variant` に載せる。
 *
 * `menu_type` はレジストリから外れた過去の値を読み飛ばすが、`leaderboard_key`
 * は外れていても落とさない。黒帯への道はそれを「範囲は分からないが挑戦は
 * した」として、バリアントを指定しない章のリンクだけに数える
 * （`PracticeAttempt` の TSDoc 参照）。未認証の場合は空配列を返す。
 */
export async function fetchAttemptedPractices(): Promise<
  readonly PracticeAttempt[]
> {
  const user = await getOptionalUser();
  if (!user) return [];

  const rows = await db
    .select({
      menuType: challengeBestScores.menuType,
      leaderboardKey: challengeBestScores.leaderboardKey,
    })
    .from(challengeBestScores)
    .where(eq(challengeBestScores.userId, user.id));

  return rows.flatMap((row) =>
    isPracticeMenuType(row.menuType)
      ? [{ slug: menuTypeToSlug(row.menuType), variant: row.leaderboardKey }]
      : [],
  );
}
