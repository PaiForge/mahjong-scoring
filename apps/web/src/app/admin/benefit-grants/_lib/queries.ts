import type { SupabaseClient } from "@supabase/supabase-js";
import { desc, sql } from "drizzle-orm";

import { benefitGrants, db, type BenefitGrant, type Profile } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";
import { getAuthUserEmails } from "@/lib/supabase/get-auth-user-emails";

import { buildProfileMap } from "../../_lib/log-query-helpers";

/** 特典付与一覧ページのデータ */
interface BenefitGrantsPageData {
  readonly grants: readonly BenefitGrant[];
  readonly currentPage: number;
  readonly totalPages: number;
  /** 対象と付与者の両方を引ける */
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

/**
 * 特典付与一覧ページのデータを取得する（新しい順・ページ送り）
 * 付与一覧取得
 *
 * 絞り込みは持たない。付与は運営者が手で置くものなので件数は少なく、
 * 必要になったら監査ログと同じ `buildUserFilterCondition` を足す。
 */
export async function fetchBenefitGrantsPageData(
  adminClient: SupabaseClient,
  page: number,
): Promise<BenefitGrantsPageData> {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(benefitGrants);

  const pagination = getPaginationData(
    page,
    Number(countResult.count),
    DEFAULT_PAGE_SIZE,
  );

  const grants = await db
    .select()
    .from(benefitGrants)
    .orderBy(desc(benefitGrants.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);

  const userIds = [
    ...new Set(grants.flatMap((grant) => [grant.userId, grant.grantedBy])),
  ];
  // 1 ページ分の ID だけ引く。メールで検索する機能が無いので全件は要らない
  const [emailMap, profileMap] = await Promise.all([
    getAuthUserEmails(userIds, adminClient),
    buildProfileMap(userIds),
  ]);

  return {
    grants,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap,
    emailMap,
  };
}
