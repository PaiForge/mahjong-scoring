import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db, profiles, userActivityLog } from '../../../../lib/db';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../../lib/pagination';

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
  let filteredUserIds: string[] | undefined;
  if (userFilter) {
    const matchingProfiles = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        or(
          ilike(profiles.username, `%${userFilter}%`),
          ilike(profiles.displayName, `%${userFilter}%`),
        ),
      );

    const { data: usersData } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    const matchingEmailUserIds = (usersData?.users ?? [])
      .filter((u) => u.email?.toLowerCase().includes(userFilter.toLowerCase()))
      .map((u) => u.id);

    const allMatchingIds = [
      ...new Set([...matchingProfiles.map((p) => p.id), ...matchingEmailUserIds]),
    ];

    if (allMatchingIds.length === 0) {
      filteredUserIds = [];
    } else {
      filteredUserIds = allMatchingIds;
      conditions.push(inArray(userActivityLog.userId, allMatchingIds));
    }
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
  const targetIds = [...new Set(logs.filter((l) => l.targetId).map((l) => l.targetId!))];
  const allLookupIds = [...new Set([...userIds, ...targetIds])];

  const lookupProfiles =
    allLookupIds.length > 0
      ? await db.select().from(profiles).where(inArray(profiles.id, allLookupIds))
      : [];
  const profileMap = new Map(lookupProfiles.map((p) => [p.id, p]));

  const emailMap = new Map<string, string>();
  if (allLookupIds.length > 0) {
    const { data: usersData } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    for (const u of usersData?.users ?? []) {
      if (u.email) {
        emailMap.set(u.id, u.email);
      }
    }
  }

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
