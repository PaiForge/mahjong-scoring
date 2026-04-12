import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq, sql } from 'drizzle-orm';

import { db, moderationActions } from '../../../../lib/db';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../../lib/pagination';
import { buildEmailMap, buildProfileMap, buildUserFilterCondition } from '../../_lib/log-query-helpers';

import type { ModerationAction, Profile } from '../../../../lib/db';

/** 監査ログページデータ */
interface AuditLogPageData {
  readonly logs: ModerationAction[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

/**
 * 監査ログページのデータを取得する。
 * 監査ログデータ取得
 */
export async function fetchAuditLogPageData(
  adminClient: SupabaseClient,
  page: number,
  actionFilter: string,
  userFilter: string,
): Promise<AuditLogPageData> {
  // Where 条件を構築
  const conditions = [];
  if (actionFilter) {
    conditions.push(eq(moderationActions.action, actionFilter));
  }

  // ユーザーフィルタ: プロフィール検索 + メール検索
  const { matchedIds: filteredTargetIds, condition: userCondition } =
    await buildUserFilterCondition(adminClient, userFilter, moderationActions.targetId);
  if (userCondition) {
    conditions.push(userCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // ページネーション用の件数取得
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(moderationActions)
    .where(whereClause);

  const pagination = getPaginationData(page, Number(countResult.count), DEFAULT_PAGE_SIZE);

  // ログ取得
  const logs =
    filteredTargetIds?.length === 0
      ? []
      : await db
          .select()
          .from(moderationActions)
          .where(whereClause)
          .orderBy(desc(moderationActions.createdAt))
          .limit(pagination.limit)
          .offset(pagination.offset);

  // ユーザー情報の取得
  const targetIds = [...new Set(logs.map((l) => l.targetId))];
  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const allUserIds = [...new Set([...targetIds, ...actorIds])];

  const profileMap = await buildProfileMap(targetIds);
  const emailMap = await buildEmailMap(adminClient, allUserIds);

  return {
    logs,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap,
    emailMap,
  };
}
