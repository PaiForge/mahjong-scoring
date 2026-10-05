import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { and, count, desc, eq } from "drizzle-orm";

import { buildProfileMap } from "@/app/admin/_lib/log-query-helpers";
import {
  benefitGrants,
  challengeResults,
  db,
  lessonCompletions,
  moderationActions,
  profiles,
  purchases,
  userExp,
  userRanks,
  userRoles,
} from "@/lib/db";
import type {
  BenefitGrant,
  ModerationAction,
  Profile,
  Purchase,
  UserRank,
} from "@/lib/db";

/** モデレーション履歴の表示件数。全件は監査ログ（`?user=`）で見る */
export const MODERATION_HISTORY_LIMIT = 20;

/** 管理画面のユーザー詳細に並べる 1 ユーザー分のデータ */
export interface UserDetail {
  readonly authUser: User;
  /** 無ければ仮登録 */
  readonly profile: Profile | undefined;
  readonly roles: readonly string[];
  readonly ranks: readonly UserRank[];
  readonly totalExp: number;
  readonly challengeCount: number;
  readonly lessonCompletionCount: number;
  /** 新しい順。取り消した行も含む */
  readonly purchases: readonly Purchase[];
  /** 新しい順。取り消した行も含む */
  readonly grants: readonly BenefitGrant[];
  /** このユーザーが対象の操作（新しい順、`MODERATION_HISTORY_LIMIT` 件まで） */
  readonly moderationEntries: readonly ModerationAction[];
  /** 付与者・操作者の表示名を引くためのプロフィール */
  readonly actorProfileMap: Map<string, Profile>;
}

/**
 * 管理画面のユーザー詳細に必要なものを 1 ユーザー分まとめて取得する
 * ユーザー詳細取得
 *
 * 認証ユーザーが無ければ null（ページは `notFound()` にする）。
 * マイページ用の `listPurchases` / `listBenefitGrants` は失敗を空配列に潰すため
 * 使わない — 管理画面で「購入なし」と「取得失敗」を取り違えると対応を誤る。
 */
export async function fetchUserDetail(
  adminClient: SupabaseClient,
  id: string,
): Promise<UserDetail | null> {
  const { data, error } = await adminClient.auth.admin.getUserById(id);
  if (error || !data.user) return null;

  const [
    [profile],
    roleRows,
    ranks,
    [expRow],
    [challengeRow],
    [lessonRow],
    purchaseRows,
    grantRows,
    moderationEntries,
  ] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, id)).limit(1),
    db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, id)),
    db
      .select()
      .from(userRanks)
      .where(eq(userRanks.userId, id))
      .orderBy(desc(userRanks.grantedAt)),
    db
      .select({ totalExp: userExp.totalExp })
      .from(userExp)
      .where(eq(userExp.userId, id)),
    db
      .select({ value: count() })
      .from(challengeResults)
      .where(eq(challengeResults.userId, id)),
    db
      .select({ value: count() })
      .from(lessonCompletions)
      .where(eq(lessonCompletions.userId, id)),
    db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, id))
      .orderBy(desc(purchases.createdAt)),
    db
      .select()
      .from(benefitGrants)
      .where(eq(benefitGrants.userId, id))
      .orderBy(desc(benefitGrants.createdAt)),
    db
      .select()
      .from(moderationActions)
      .where(
        and(
          eq(moderationActions.targetType, "user"),
          eq(moderationActions.targetId, id),
        ),
      )
      .orderBy(desc(moderationActions.createdAt))
      .limit(MODERATION_HISTORY_LIMIT),
  ]);

  const actorProfileMap = await buildProfileMap([
    ...new Set([
      ...grantRows.map((g) => g.grantedBy),
      ...moderationEntries.map((m) => m.actorId),
    ]),
  ]);

  return {
    authUser: data.user,
    profile,
    roles: roleRows.map((r) => r.role),
    ranks,
    totalExp: expRow?.totalExp ?? 0,
    challengeCount: challengeRow?.value ?? 0,
    lessonCompletionCount: lessonRow?.value ?? 0,
    purchases: purchaseRows,
    grants: grantRows,
    moderationEntries,
    actorProfileMap,
  };
}
