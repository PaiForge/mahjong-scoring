/**
 * ローカル開発用シードユーザーの定義と投入処理
 * シードユーザー
 *
 * `auth.users` / `profiles` / `user_roles` の 3 つを揃えて 1 人分の
 * 「ログインしてすぐ使えるユーザー」を作る。プロフィール作成は
 * アプリ側と同じくアプリ層の責務（`registerUsername`）なので、
 * ここでもサインアップ経路と同じ順序（createUser → profiles INSERT）で作る。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { profiles, userRoles } from "../../src/lib/db/schema";

export interface SeedUser {
  readonly email: string;
  /** `validateUsername` を通る形式（英小文字始まり・ハイフン不可） */
  readonly username: string;
  readonly displayName: string;
  /**
   * `user_roles` に admin 行を入れる。
   *
   * 管理画面は `requireAdmin()` がこのテーブルを直接見るだけなので、
   * ローカルで `/admin` を触るにはこの行があれば足りる。
   * 投入先をローカルに限定しているため自動化してよい。
   */
  readonly isAdmin?: boolean;
}

/**
 * 投入するユーザー一覧。
 *
 * 管理者と一般ユーザーを分けているのは、「管理者でないユーザーが
 * `/admin` にアクセスすると 404」という経路を同じシードのまま
 * 確認できるようにするため。
 */
export const SEED_USERS: readonly SeedUser[] = [
  {
    email: "admin@example.local",
    username: "seed_admin",
    displayName: "管理者（シード）",
    isAdmin: true,
  },
  {
    email: "user@example.local",
    username: "seed_user",
    displayName: "一般ユーザー（シード）",
  },
];

/** シードユーザー共通のパスワード（`password_requirements = letters_digits` を満たす） */
export const SEED_PASSWORD = "devpass1";

/**
 * シードユーザーを冪等に作成する（既にいれば作り直さない）
 * シードユーザー作成
 *
 * @param admin service_role キーで作った Supabase クライアント
 * @param db ローカル Postgres への Drizzle クライアント
 * @param user 作成するユーザーの定義
 * @returns 作成済み／既存の `auth.users.id`
 */
export async function ensureSeedUser(
  admin: SupabaseClient,
  db: PostgresJsDatabase,
  user: SeedUser,
): Promise<string> {
  const userId = await ensureAuthUser(admin, user);

  await db
    .insert(profiles)
    .values({
      id: userId,
      username: user.username,
      displayName: user.displayName,
    })
    .onConflictDoNothing();

  if (user.isAdmin) {
    await db
      .insert(userRoles)
      .values({ userId, role: "admin" })
      .onConflictDoNothing();
  }

  return userId;
}

/**
 * `auth.users` の行を取得または作成する
 * 認証ユーザー確保
 *
 * Supabase JS には email 指定の取得 API が無いため、存在確認は
 * `listUsers` で行う。`perPage` の上限は 1000 で、ローカルの
 * シード件数はそれを大きく下回る。
 */
async function ensureAuthUser(
  admin: SupabaseClient,
  user: SeedUser,
): Promise<string> {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (list.error) throw list.error;

  const existing = list.data.users.find((u) => u.email === user.email);
  if (existing) {
    return existing.id;
  }

  // email_confirm: true で確認メールの経路を飛ばす（ローカルの Mailpit を
  // 開かずにそのままサインインできるようにするため）。
  const created = await admin.auth.admin.createUser({
    email: user.email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.displayName },
  });
  if (created.error) throw created.error;
  if (!created.data.user) {
    throw new Error(`createUser がユーザーを返しませんでした: ${user.email}`);
  }

  return created.data.user.id;
}
