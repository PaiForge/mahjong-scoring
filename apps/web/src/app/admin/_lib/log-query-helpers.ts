import type { User } from "@supabase/supabase-js";
import type { Column } from "drizzle-orm";
import { ilike, inArray, or } from "drizzle-orm";

import { db, profiles } from "../../../lib/db";
import { escapeLikePattern } from "../../../lib/escape-like-pattern";

import type { Profile } from "../../../lib/db";

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
 * ユーザーの表示名を解決する。
 * プロフィール名 → メールアドレス → ID の順でフォールバックする。
 * ユーザー表示名解決
 *
 * @param id - ユーザーID
 * @param profileMap - ID→Profile のマップ
 * @param emailMap - ID→メールアドレスのマップ
 */
export function resolveUserDisplay(
  id: string,
  profileMap: Map<string, Profile>,
  emailMap: Map<string, string>,
): string {
  return profileMap.get(id)?.username ?? emailMap.get(id) ?? id;
}

/**
 * 検索文字列に合致するユーザーIDを集める。
 * プロフィール（username / displayName）とメールアドレスを部分一致・大文字小文字無視で検索する。
 * ユーザー検索
 *
 * 管理画面の「ユーザーで絞り込み」（ログ画面）と「ユーザー検索」（ユーザー一覧）が
 * 同じ文字列で同じユーザーに当たるよう、照合はここに集める。
 *
 * @param allUsers - `listAllAuthUsers` で事前取得した認証ユーザー一覧
 * @param query - 検索文字列（空文字を渡さないこと）
 */
export async function findUserIdsMatching(
  allUsers: readonly User[],
  query: string,
): Promise<string[]> {
  const pattern = `%${escapeLikePattern(query)}%`;
  const matchingProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      or(
        ilike(profiles.username, pattern),
        ilike(profiles.displayName, pattern),
      ),
    );

  const lowerQuery = query.toLowerCase();
  const matchingEmailUserIds = allUsers
    .filter((u) => u.email?.toLowerCase().includes(lowerQuery))
    .map((u) => u.id);

  return [
    ...new Set([...matchingProfiles.map((p) => p.id), ...matchingEmailUserIds]),
  ];
}

/**
 * ユーザーフィルタ条件を構築する。
 * `findUserIdsMatching` で合致したユーザーIDで `inArray` 条件を返す。
 *
 * @param allUsers - `listAllAuthUsers` で事前取得した認証ユーザー一覧
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

  const allMatchingIds = await findUserIdsMatching(allUsers, userFilter);

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
 * @param allUsers - `listAllAuthUsers` で事前取得した認証ユーザー一覧
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
