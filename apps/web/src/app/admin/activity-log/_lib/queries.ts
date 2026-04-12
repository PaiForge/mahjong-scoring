import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq, sql } from 'drizzle-orm';

import { db, userActivityLog } from '../../../../lib/db';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../../lib/pagination';
import { buildEmailMap, buildProfileMap, buildUserFilterCondition } from '../../_lib/log-query-helpers';

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
 * アクティビティログデータ取得
 */
export async function fetchActivityLogPageData(
  adminClient: SupabaseClient,
  page: number,
  actionFilter: string,
  userFilter: string,
): Promise<ActivityLogPageData> {
  // Where 条件を構築
  const conditions = [];
  if (actionFilter) {
    conditions.push(eq(userActivityLog.action, actionFilter));
  }

  // ユーザーフィルタ
  const { matchedIds: filteredUserIds, condition: userCondition } =
    await buildUserFilterCondition(adminClient, userFilter, userActivityLog.userId);
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
  const emailMap = await buildEmailMap(adminClient, allLookupIds);

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
