import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Column } from 'drizzle-orm';
import { ilike, inArray, or } from 'drizzle-orm';

import { db, profiles } from '../../../lib/db';
import { escapeLikePattern } from '../../../lib/escape-like-pattern';

import type { Profile } from '../../../lib/db';

/**
 * Supabase 認証ユーザー一覧を取得する（同一リクエスト内で重複呼び出しを防ぐキャッシュ付き）。
 * `buildUserFilterCondition` と `buildEmailMap` が同じ `adminClient` で呼ばれた場合に
 * `listUsers()` の重複リクエストを排除する。
 *
 * 認証ユーザー一覧取得
 *
 * TODO: ユーザー数が100人を超える場合、ページネーションで全件取得する必要がある
 */
const adminUsersCache = new WeakMap<SupabaseClient, Promise<readonly User[]>>();

function getAdminUsers(adminClient: SupabaseClient): Promise<readonly User[]> {
  const cached = adminUsersCache.get(adminClient);
  if (cached) return cached;

  const promise = adminClient.auth.admin
    .listUsers({ page: 1, perPage: 100 })
    .then(({ data }) => data?.users ?? []);

  adminUsersCache.set(adminClient, promise);
  return promise;
}

/**
 * ユーザーフィルタ結果。
 * プロフィール検索 + メールアドレス検索で合致したユーザーID一覧
 */
interface UserFilterResult {
  /** 合致したユーザーID一覧。フィルタ未指定時は `undefined` */
  readonly matchedIds: readonly string[] | undefined;
  /** ログテーブルに適用する `inArray` 条件。合致なし・フィルタ未指定時は `undefined` */
  readonly condition: ReturnType<typeof inArray> | undefined;
}

/**
 * ユーザーフィルタ条件を構築する。
 * プロフィール（username / displayName）とメールアドレスの両方を検索し、
 * 合致するユーザーIDで `inArray` 条件を返す。
 *
 * @param adminClient - Supabase 管理クライアント（認証ユーザー一覧取得用）
 * @param userFilter - 検索文字列（空文字の場合はフィルタなし）
 * @param targetColumn - 条件を適用するログテーブルのカラム
 */
export async function buildUserFilterCondition(
  adminClient: SupabaseClient,
  userFilter: string,
  targetColumn: Column,
): Promise<UserFilterResult> {
  if (!userFilter) {
    return { matchedIds: undefined, condition: undefined };
  }

  const matchingProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      or(
        ilike(profiles.username, `%${escapeLikePattern(userFilter)}%`),
        ilike(profiles.displayName, `%${escapeLikePattern(userFilter)}%`),
      ),
    );

  const users = await getAdminUsers(adminClient);
  const matchingEmailUserIds = users
    .filter((u) => u.email?.toLowerCase().includes(userFilter.toLowerCase()))
    .map((u) => u.id);

  const allMatchingIds = [
    ...new Set([...matchingProfiles.map((p) => p.id), ...matchingEmailUserIds]),
  ];

  if (allMatchingIds.length === 0) {
    return { matchedIds: [], condition: undefined };
  }

  return {
    matchedIds: allMatchingIds,
    condition: inArray(targetColumn, allMatchingIds),
  };
}

/**
 * メールアドレスマップを構築する。
 * Supabase 認証ユーザー一覧からユーザーID→メールアドレスの Map を返す。
 *
 * @param adminClient - Supabase 管理クライアント
 * @param userIds - メールアドレスを取得する対象のユーザーID一覧（空の場合は空 Map を返す）
 */
export async function buildEmailMap(
  adminClient: SupabaseClient,
  userIds: readonly string[],
): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();

  if (userIds.length === 0) {
    return emailMap;
  }

  const users = await getAdminUsers(adminClient);
  for (const u of users) {
    if (u.email) {
      emailMap.set(u.id, u.email);
    }
  }

  return emailMap;
}

/**
 * プロフィールマップを構築する。
 * 指定されたユーザーID一覧から profiles テーブルを検索し、ID→Profile の Map を返す。
 *
 * @param userIds - プロフィールを取得する対象のユーザーID一覧（空の場合は空 Map を返す）
 */
export async function buildProfileMap(
  userIds: readonly string[],
): Promise<Map<string, Profile>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const lookupProfiles = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.id, [...userIds]));

  return new Map(lookupProfiles.map((p) => [p.id, p]));
}
