"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "../../../../lib/action-types";
import { getClientIp } from "../../../../lib/client-ip";
import { db, profiles } from "../../../../lib/db";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requireAdminActor } from "../../_lib/auth";
import { recordModerationAction } from "../_lib/moderation";

/**
 * ユーザーの BAN を解除する Server Action。
 *
 * Two-phase unban: Supabase Auth で BAN 解除 → DB トランザクションで
 * profiles.bannedAt を null に + moderationActions INSERT。
 * DB 更新失敗時は Auth 側を re-ban する。
 *
 * ユーザーBAN解除
 */
export async function unbanUser(targetUserId: string): Promise<ActionResult> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId } = admin;

  const adminClient = createAdminClient();
  const ipAddress = await getClientIp();

  // 元の bannedAt を保存（ロールバック用）
  const [profile] = await db
    .select({ bannedAt: profiles.bannedAt })
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  const originalBannedAt = profile?.bannedAt;

  // Phase 1: Supabase Auth で BAN 解除
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: "none" },
  );

  if (authError) {
    return { error: "unbanFailed" };
  }

  // Phase 2: DB トランザクション
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({ bannedAt: sql`NULL` })
        .where(eq(profiles.id, targetUserId));

      await recordModerationAction(tx, {
        actorId,
        action: "unban",
        targetId: targetUserId,
        ipAddress,
      });
    });
  } catch {
    // DB 失敗時: Auth 側を re-ban + bannedAt 復元
    await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: "876000h",
    });
    if (originalBannedAt) {
      await db
        .update(profiles)
        .set({ bannedAt: originalBannedAt })
        .where(eq(profiles.id, targetUserId));
    }
    return { error: "unbanFailed" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
