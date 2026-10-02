"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { insertBenefitGrant } from "@/lib/entitlements/benefit-grants";
import { logExternalError } from "@/lib/log-error";

import { requireAdminActor } from "../../_lib/auth";
import {
  GRANT_DURATION_DAYS,
  isGrantDurationKey,
} from "../_lib/grant-durations";
import {
  ModerationActionKind,
  recordModerationAction,
} from "../_lib/moderation";

/** 付与の失敗理由 */
export type GrantBenefitsError =
  "unauthorized" | "invalidDuration" | "invalidReason" | "grantFailed";

/**
 * ユーザーに Pro の特典を手動で付与する Server Action
 * 特典付与
 *
 * 付与行（`benefit_grants`）と監査ログ（`moderation_actions`）を 1 つの
 * トランザクションで書く。どちらか片方だけ残らない。
 *
 * プランは `pro` 固定（特典を個別に選ばせない）。期間は列挙した選択肢から
 * （`grant-durations.ts`）。理由は必須。
 *
 * @param targetUserId - 付与先
 * @param duration - 期間のキー。クライアントの入力なので絞る
 * @param reason - 付与の理由
 */
export async function grantBenefits(
  targetUserId: string,
  duration: string,
  reason: string,
): Promise<ActionResult<GrantBenefitsError>> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId } = admin;

  if (!isGrantDurationKey(duration)) {
    return { error: "invalidDuration" };
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0 || trimmedReason.length > 1000) {
    return { error: "invalidReason" };
  }

  const ipAddress = await getClientIp();

  try {
    await db.transaction(async (tx) => {
      const grant = await insertBenefitGrant(tx, {
        userId: targetUserId,
        plan: "pro",
        reason: trimmedReason,
        grantedBy: actorId,
        durationDays: GRANT_DURATION_DAYS[duration],
      });

      await recordModerationAction(tx, {
        actorId,
        action: ModerationActionKind.GrantBenefits,
        targetId: targetUserId,
        reason: trimmedReason,
        ipAddress,
        metadata: {
          grantId: grant.id,
          plan: grant.plan,
          benefits: grant.benefits,
          expiresAt: grant.expiresAt?.toISOString() ?? null,
        },
      });
    });
  } catch (error) {
    logExternalError("grantBenefits", "failed to grant benefits", error);
    return { error: "grantFailed" };
  }

  revalidatePath("/admin/benefit-grants");
  return { success: true };
}
