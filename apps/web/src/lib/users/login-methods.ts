import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { isKnownAuthProvider } from "@mahjong-scoring/features/account/auth-provider";
import type {
  LinkedIdentity,
  LoginMethods,
} from "@mahjong-scoring/features/account/login-methods";

import { db } from "../db";
import { logExternalError } from "../log-error";
import { createAdminClient } from "../supabase/admin";

/**
 * アカウントのページが出すログインの状態
 * アカウントのログイン状態
 *
 * {@link LoginMethods} に、アカウントのメールアドレスと変更待ちの新しい
 * アドレスを足したもの。
 */
export interface AccountLoginState extends LoginMethods {
  readonly email: string | undefined;
  /**
   * メールアドレスの変更を始めて、確認が終わっていない新しいアドレス。
   * 変更前・変更後の両方の確認メールを開くと消える
   */
  readonly pendingEmail: string | undefined;
  /**
   * Apple の連携の ID → その Apple のユーザー ID（`provider_id`）。連携を外す
   * ときに、保存した Apple の refresh token と突き合わせる
   */
  readonly appleSubjects: ReadonlyMap<string, string>;
}

const identityRowSchema = z.object({
  id: z.string(),
  provider: z.string(),
  provider_id: z.string(),
  email: z.string().nullable(),
});

const loginStateRowSchema = z.object({
  email: z.string().nullable(),
  has_password: z.boolean(),
  pending_email: z.string().nullable(),
  identities: z.array(identityRowSchema),
});

/**
 * ログインの状態を認証サーバーの表から読む
 * ログイン状態の読み取り
 *
 * `auth.users` と `auth.identities` を直接読む。パスワードの有無
 * （`encrypted_password`）と変更待ちのアドレス（`email_change`）は
 * 認証サーバーの API に出ないため。連携は作られた順に並べる。
 *
 * 知らないプロバイダの連携（認証サーバーに新しいプロバイダを足した直後等）は
 * 一覧から落とす — 辞書に名前が無く、外す判定の対象でもない。
 */
export async function getAccountLoginState(
  userId: string,
): Promise<AccountLoginState> {
  const rows = await db.execute(sql`
    select
      u.email,
      coalesce(u.encrypted_password, '') <> '' as has_password,
      nullif(u.email_change, '') as pending_email,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', i.id,
              'provider', i.provider,
              'provider_id', i.provider_id,
              'email', i.identity_data ->> 'email'
            )
            order by i.created_at
          )
          from auth.identities i
          where i.user_id = u.id
        ),
        '[]'::json
      ) as identities
    from auth.users u
    where u.id = ${userId}
  `);
  const row = loginStateRowSchema.parse(rows[0]);
  const identities: LinkedIdentity[] = [];
  const appleSubjects = new Map<string, string>();
  for (const identity of row.identities) {
    if (!isKnownAuthProvider(identity.provider)) continue;
    identities.push({
      id: identity.id,
      provider: identity.provider,
      email: identity.email ?? undefined,
    });
    if (identity.provider === "apple")
      appleSubjects.set(identity.id, identity.provider_id);
  }
  return {
    email: row.email ?? undefined,
    hasPassword: row.has_password,
    pendingEmail: row.pending_email ?? undefined,
    identities,
    appleSubjects,
  };
}

/**
 * パスワードでログインする人に `email` の連携を持たせる
 * email 連携の補完
 *
 * Google / Apple で登録した人がパスワードを設定しても、認証サーバーは `email`
 * の連携を作らない（パスワードのログインはできる）。連携が 1 つのままだと、
 * 認証サーバーは「最後の連携」として Google / Apple を外させない。
 * 管理 API で同じメールアドレスを確認済みとして書き直すと、無い `email` の
 * 連携だけが作られる（アドレスも他の値も変わらない）。
 *
 * パスワードを設定した直後と、連携を外す直前に呼ぶ。既に持っていれば何も
 * しない。失敗は記録して握る — 連携が無くても、ログインの手段そのものは
 * 増えている（外す操作は認証サーバーが断り、画面に理由が出る）。
 */
export async function ensureEmailIdentity(
  userId: string,
  email: string,
  identities: readonly LinkedIdentity[],
): Promise<void> {
  if (identities.some((i) => i.provider === "email")) return;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  });
  if (error)
    logExternalError(
      "ensureEmailIdentity",
      "failed to create the email identity",
      error,
    );
}
