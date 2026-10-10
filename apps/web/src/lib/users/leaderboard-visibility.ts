import "server-only";

import { eq } from "drizzle-orm";

import { purgeLeaderboardCache } from "../cache-tags";
import { profiles } from "../db";
import { writeAsAccount } from "./account-write-lock";

/**
 * ランキングに表示しない設定を保存する
 * ランキング非表示設定保存
 *
 * web の Server Action（設定のプライバシー）とアプリ向け API の両方から呼ぶ。
 * 認証と回数制限は呼び出し側が済ませること。DB の失敗はそのまま投げるので、
 * 記録と応答は呼び出し側が決める。
 *
 * ランキングのキャッシュは 5 分保持なので、purge しないと切り替えたのに
 * まだ自分が載っている画面をしばらく見せてしまう。タグは全ユーザー共通で、
 * 切り替え自体は滅多に起きない操作のため、粒度を細かくはしない。
 *
 * @param hidden - true でランキングから外れる
 * @returns 退会を受け付けた後なら `written: false`（何も書かない）
 */
export async function saveLeaderboardVisibility(
  userId: string,
  hidden: boolean,
): Promise<{ readonly written: boolean }> {
  const { written } = await writeAsAccount(userId, (tx) =>
    tx
      .update(profiles)
      .set({ hiddenFromLeaderboard: hidden, updatedAt: new Date() })
      .where(eq(profiles.id, userId)),
  );
  if (written) purgeLeaderboardCache();
  return { written };
}
