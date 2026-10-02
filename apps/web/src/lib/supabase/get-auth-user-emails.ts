import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "./admin";

/**
 * 指定した ID の認証ユーザーのメールアドレスだけを引く
 * メール個別取得
 *
 * `listAllAuthUsers` は全ユーザーを辿るので、1 ページに出る数十人の表示名を
 * 解決するだけの用途には使わない（登録者数に比例して遅くなる）。Supabase
 * Admin API に ID の一括取得は無いため `getUserById` を ID ごとに並列で呼ぶ。
 * 対象が多い（メールで検索する・集計する）処理は `listAllAuthUsers` のまま。
 *
 * 存在しない ID（退会済み等）は結果に含めない。取得に失敗した ID は
 * 表示名の解決に落ちるだけなので、他の ID まで巻き込まず throw する。
 *
 * @param userIds - 重複していてもよい。空なら API を呼ばない
 */
export async function getAuthUserEmails(
  userIds: readonly string[],
  adminClient: SupabaseClient = createAdminClient(),
): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return emailMap;

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data, error } = await adminClient.auth.admin.getUserById(id);
      if (error) {
        // 見つからない ID は「無い」として扱う。それ以外（権限・通信）は伝える
        if (error.status === 404) return undefined;
        throw new Error(`Failed to fetch user ${id}: ${error.message}`);
      }
      return data.user;
    }),
  );
  for (const user of results) {
    if (user?.email) emailMap.set(user.id, user.email);
  }
  return emailMap;
}
