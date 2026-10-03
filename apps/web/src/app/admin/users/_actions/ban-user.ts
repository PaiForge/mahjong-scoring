"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "../../../../lib/action-types";
import { getClientIp } from "../../../../lib/client-ip";
import { db, profiles } from "../../../../lib/db";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requireAdminActor } from "../../_lib/auth";
import { normalizeModerationReason } from "../_lib/moderation-reason";
import {
  NO_BAN_DURATION,
  PERMANENT_BAN_DURATION,
  recordModerationAction,
} from "../_lib/moderation";

/**
 * ユーザーを BAN する Server Action。
 *
 * Two-phase ban: Supabase Auth で BAN → DB トランザクションで
 * profiles.bannedAt 更新 + moderationActions INSERT。
 * DB 更新失敗時は Auth 側を rollback する。
 *
 * 仮登録（プロフィール無し）も BAN できる。その場合 `profiles` の更新は
 * 0 行で、BAN は Auth 側にだけ残る。管理画面は `resolveUserStatus` が
 * Auth の `banned_until` も見るので、仮登録でも BAN 済みと出て解除できる。
 *
 * ユーザーBAN
 */
/** BAN の失敗理由 */
export type BanUserError =
  "unauthorized" | "cannotBanSelf" | "invalidReason" | "banFailed";

export async function banUser(
  targetUserId: string,
  reason: string,
): Promise<ActionResult<BanUserError>> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId } = admin;

  // 自分自身の BAN を禁止
  if (actorId === targetUserId) {
    return { error: "cannotBanSelf" };
  }

  const trimmedReason = normalizeModerationReason(reason);
  if (trimmedReason === undefined) {
    return { error: "invalidReason" };
  }

  const adminClient = createAdminClient();
  const ipAddress = await getClientIp();

  // Phase 1: Supabase Auth で BAN
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: PERMANENT_BAN_DURATION },
  );

  if (authError) {
    return { error: "banFailed" };
  }

  // Phase 2: DB トランザクション
  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({ bannedAt: now })
        .where(eq(profiles.id, targetUserId));

      await recordModerationAction(tx, {
        actorId,
        action: "ban",
        targetId: targetUserId,
        reason: trimmedReason,
        ipAddress,
      });
    });
  } catch {
    // DB 失敗時: Auth 側をロールバック
    await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: NO_BAN_DURATION,
    });
    return { error: "banFailed" };
  }

  // 一覧と詳細（/admin/users/[id]）の両方の状態表示を更新する
  revalidatePath("/admin/users", "layout");
  return { success: true };
}
