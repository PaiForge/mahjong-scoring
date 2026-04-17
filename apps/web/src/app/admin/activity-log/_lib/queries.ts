import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq, sql } from 'drizzle-orm';

import { db, userActivityLog } from '../../../../lib/db';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../../lib/pagination';
import { buildEmailMap, buildProfileMap, buildUserFilterCondition, fetchAllAuthUsers } from '../../_lib/log-query-helpers';

import type { Profile, UserActivityLog } from '../../../../lib/db';

/** アクティビティログページデータ */
interface ActivityLogPageData {
  readonly logs: UserActivityLog[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
  readonly actionTypes: readonly { action: string }[];
}

/**
 * アクティビティログページのデータを取得する。
 *
 * NOTE: audit-log/queries.ts と構造が類似しているが、操作対象のテーブル・
 * カラム・戻り値型が異なるため、Drizzle の型制約上ジェネリックな共通関数に
 * 抽出するとかえって複雑になる。共通化可能なヘルパー（ユーザーフィルタ・
 * プロフィール/メール解決）は log-query-helpers.ts に既に抽出済み。
 */
export async function fetchActivityLogPageData(
  adminClient: SupabaseClient,
  page: number,
  actionFilter: string,
  userFilter: string,
): Promise<ActivityLogPageData> {
  // 認証ユーザー一覧を一度だけ取得
  const allUsers = await fetchAllAuthUsers(adminClient);

  // Where 条件を構築
  const conditions = [];
  if (actionFilter) {
    conditions.push(eq(userActivityLog.action, actionFilter));
  }

  // ユーザーフィルタ
  const { matchedIds: filteredUserIds, condition: userCondition } =
    await buildUserFilterCondition(allUsers, userFilter, userActivityLog.userId);
  if (userCondition) {
    conditions.push(userCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 件数取得
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userActivityLog)
    .where(whereClause);

  const pagination = getPaginationData(page, Number(countResult.count), DEFAULT_PAGE_SIZE);

  // ログ取得
  const logs =
    filteredUserIds?.length === 0
      ? []
      : await db
          .select()
          .from(userActivityLog)
          .where(whereClause)
          .orderBy(desc(userActivityLog.createdAt))
          .limit(pagination.limit)
          .offset(pagination.offset);

  // ユーザー情報の取得
  const userIds = [...new Set(logs.map((l) => l.userId))];
  const targetIds = [...new Set(logs.flatMap((l) => (l.targetId ? [l.targetId] : [])))];
  const allLookupIds = [...new Set([...userIds, ...targetIds])];

  const profileMap = await buildProfileMap(allLookupIds);
  const emailMap = buildEmailMap(allUsers, allLookupIds);

  // アクション種別一覧（フィルタ用）
  const actionTypes = await db
    .selectDistinct({ action: userActivityLog.action })
    .from(userActivityLog)
    .orderBy(userActivityLog.action);

  return {
    logs,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap,
    emailMap,
    actionTypes,
  };
}
