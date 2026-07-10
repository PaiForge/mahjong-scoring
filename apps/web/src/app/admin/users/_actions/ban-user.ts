"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "../../../../lib/action-types";
import { getClientIp } from "../../../../lib/client-ip";
import { db, profiles } from "../../../../lib/db";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requireAdminActor } from "../../_lib/auth";
import { recordModerationAction } from "../_lib/moderation";

/**
 * ユーザーを BAN する Server Action。
 *
 * Two-phase ban: Supabase Auth で BAN → DB トランザクションで
 * profiles.bannedAt 更新 + moderationActions INSERT。
 * DB 更新失敗時は Auth 側を rollback する。
 *
 * ユーザーBAN
 */
export async function banUser(
  targetUserId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId } = admin;

  // 自分自身の BAN を禁止
  if (actorId === targetUserId) {
    return { error: "cannotBanSelf" };
  }

  // 理由バリデーション
  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0 || trimmedReason.length > 1000) {
    return { error: "invalidReason" };
  }

  const adminClient = createAdminClient();
  const ipAddress = await getClientIp();

  // Phase 1: Supabase Auth で BAN
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: "876000h" },
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
      ban_duration: "none",
    });
    return { error: "banFailed" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
