import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db, moderationActions, profiles } from '../../../../lib/db';
import { escapeLikePattern } from '../../../../lib/escape-like-pattern';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../../../../lib/pagination';

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
  let filteredTargetIds: string[] | undefined;
  if (userFilter) {
    const matchingProfiles = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        or(
          ilike(profiles.username, `%${escapeLikePattern(userFilter)}%`),
          ilike(profiles.displayName, `%${escapeLikePattern(userFilter)}%`),
        ),
      );

    // TODO: ユーザー数が100人を超える場合、ページネーションで全件取得する必要がある
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
      filteredTargetIds = [];
    } else {
      filteredTargetIds = allMatchingIds;
      conditions.push(inArray(moderationActions.targetId, allMatchingIds));
    }
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

  const targetProfiles =
    targetIds.length > 0
      ? await db.select().from(profiles).where(inArray(profiles.id, targetIds))
      : [];
  const profileMap = new Map(targetProfiles.map((p) => [p.id, p]));

  const emailMap = new Map<string, string>();
  if (allUserIds.length > 0) {
    // TODO: ユーザー数が100人を超える場合、ページネーションで全件取得する必要がある
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

  return {
    logs,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap,
    emailMap,
  };
}
