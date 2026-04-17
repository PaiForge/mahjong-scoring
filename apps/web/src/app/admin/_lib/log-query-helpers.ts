import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Column } from 'drizzle-orm';
import { ilike, inArray, or } from 'drizzle-orm';

import { db, profiles } from '../../../lib/db';
import { escapeLikePattern } from '../../../lib/escape-like-pattern';

import type { Profile } from '../../../lib/db';

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

// TODO: ユーザー数が100人を超える場合、ページネーションで全件取得する必要がある
/**
 * Supabase 認証ユーザー一覧を取得する。
 * 複数箇所で同じユーザー一覧を参照する場合、この関数を一度だけ呼び出して
 * 結果を使い回すこと。
 */
export async function fetchAllAuthUsers(
  adminClient: SupabaseClient,
): Promise<readonly User[]> {
  const { data: usersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  return usersData?.users ?? [];
}

/**
 * ユーザーフィルタ条件を構築する。
 * プロフィール（username / displayName）とメールアドレスの両方を検索し、
 * 合致するユーザーIDで `inArray` 条件を返す。
 *
 * @param allUsers - `fetchAllAuthUsers` で事前取得した認証ユーザー一覧
 * @param userFilter - 検索文字列（空文字の場合はフィルタなし）
 * @param targetColumn - 条件を適用するログテーブルのカラム
 */
export async function buildUserFilterCondition(
  allUsers: readonly User[],
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

  const matchingEmailUserIds = allUsers
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
 * 事前取得した認証ユーザー一覧から、指定されたユーザーIDに絞って
 * ユーザーID→メールアドレスの Map を返す。
 *
 * @param allUsers - `fetchAllAuthUsers` で事前取得した認証ユーザー一覧
 * @param userIds - メールアドレスを取得する対象のユーザーID一覧（空の場合は空 Map を返す）
 */
export function buildEmailMap(
  allUsers: readonly User[],
  userIds: readonly string[],
): Map<string, string> {
  const emailMap = new Map<string, string>();

  if (userIds.length === 0) {
    return emailMap;
  }

  const userIdSet = new Set(userIds);
  for (const u of allUsers) {
    if (u.email && userIdSet.has(u.id)) {
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
