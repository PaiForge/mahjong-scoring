import "server-only";

import { sql } from "drizzle-orm";

import { db } from "../db";

/**
 * ユーザーに Apple の連携（identity）がつながっているか
 * Apple連携確認
 *
 * `auth.identities` を直接読む。Auth のソフトデリートの後も行と
 * `provider` は残る（`provider_id` などだけが読めない値に置き換わる）ので、
 * ログインを無効にした後の退会の工程からも判定できる。
 */
export async function hasAppleIdentity(userId: string): Promise<boolean> {
  const rows = await db.execute<{ linked: boolean }>(
    sql`select exists(select 1 from auth.identities where user_id = ${userId} and provider = 'apple') as linked`,
  );
  return rows[0]?.linked === true;
}
