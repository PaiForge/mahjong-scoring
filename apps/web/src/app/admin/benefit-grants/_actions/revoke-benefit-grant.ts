"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { db, type BenefitGrant } from "@/lib/db";
import { revokeBenefitGrant } from "@/lib/entitlements/benefit-grants";
import { logExternalError } from "@/lib/log-error";
import { notifyQuietly } from "@/lib/notifications/create-notification";
import {
  NotificationTargetType,
  NotificationType,
} from "@/lib/notifications/types";

import { requireAdminActor } from "../../_lib/auth";
import { normalizeModerationReason } from "../../users/_lib/moderation-reason";
import {
  ModerationActionKind,
  recordModerationAction,
} from "../../users/_lib/moderation";

/** 取り消しの失敗理由 */
export type RevokeBenefitGrantError =
  "unauthorized" | "invalidReason" | "notFound" | "revokeFailed";

/**
 * 特典の手動付与を取り消す Server Action
 * 付与取り消し
 *
 * 付与行の `revoked_at` と監査ログ（`moderation_actions`）を 1 つの
 * トランザクションで書く。既に取り消し済み・存在しない付与は `notFound`。
 * 取り消せたら付与先に通知する（トランザクションの外。通知の失敗で
 * 取り消しは失敗しない）。
 *
 * @param grantId - 付与の ID
 * @param reason - 取り消しの理由。必須
 */
export async function revokeBenefitGrantAction(
  grantId: string,
  reason: string,
): Promise<ActionResult<RevokeBenefitGrantError>> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId } = admin;

  const trimmedReason = normalizeModerationReason(reason);
  if (trimmedReason === undefined) {
    return { error: "invalidReason" };
  }

  const ipAddress = await getClientIp();

  let revoked: BenefitGrant | undefined;
  try {
    await db.transaction(async (tx) => {
      const grant = await revokeBenefitGrant(tx, grantId, trimmedReason);
      if (!grant) return;
      revoked = grant;

      await recordModerationAction(tx, {
        actorId,
        action: ModerationActionKind.RevokeBenefits,
        targetId: grant.userId,
        reason: trimmedReason,
        ipAddress,
        metadata: { grantId: grant.id, plan: grant.plan },
      });
    });
  } catch (error) {
    logExternalError("revokeBenefitGrant", "failed to revoke grant", error);
    return { error: "revokeFailed" };
  }

  if (!revoked) return { error: "notFound" };

  await notifyQuietly({
    userId: revoked.userId,
    type: NotificationType.BenefitGrantRevoked,
    target: { type: NotificationTargetType.BenefitGrant, id: revoked.id },
    metadata: { plan: revoked.plan },
  });

  revalidatePath("/admin/benefit-grants");
  return { success: true };
}
