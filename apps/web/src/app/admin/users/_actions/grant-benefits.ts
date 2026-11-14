"use server";

import type { ActionResult } from "@/lib/action-types";
import { db, type BenefitGrant } from "@/lib/db";
import { insertBenefitGrant } from "@/lib/entitlements/benefit-grants";
import { logExternalError } from "@/lib/log-error";
import { notifyQuietly } from "@/lib/notifications/create-notification";
import { NotificationTargetType } from "@/lib/notifications/types";
import { BENEFIT_GRANT_MESSAGE_MAX_LENGTH } from "@mahjong-scoring/features/notifications/message";
import { NotificationType } from "@mahjong-scoring/features/notifications/types";

import { requireAdminActor } from "../../_lib/auth";
import { normalizeModerationReason } from "../_lib/moderation-reason";
import {
  GRANT_DURATION_DAYS,
  isGrantDurationKey,
} from "../_lib/grant-durations";
import {
  ModerationActionKind,
  recordModerationAction,
} from "../_lib/moderation";
import { revalidateBenefitGrantViews } from "../_lib/revalidate";

/** 付与の失敗理由 */
export type GrantBenefitsError =
  | "unauthorized"
  | "invalidDuration"
  | "invalidReason"
  | "invalidMessage"
  | "grantFailed";

/**
 * ユーザーに Pro の特典を手動で付与する Server Action
 * 特典付与
 *
 * 付与行（`benefit_grants`）と監査ログ（`moderation_actions`）を 1 つの
 * トランザクションで書く。どちらか片方だけ残らない。書けたら付与先に
 * 通知する（トランザクションの外。通知の失敗で付与は失敗しない）。
 *
 * プランは `pro` 固定（特典を個別に選ばせない）。期間は列挙した選択肢から
 * （`grant-durations.ts`）。理由は必須。
 *
 * 通知に出す文（`message`）は任意。書けば付与の通知の 1 文目（「運営から Pro が
 * 付与されました」）に替わり、期限の文は辞書が足す（文面の組み立ては features の
 * `buildNotificationMessage`）。理由は運営の内部メモで利用者に出さないので、
 * 利用者に見せる文は別の欄で受ける。送った文は通知の metadata と監査ログに残る。
 *
 * @param targetUserId - 付与先
 * @param duration - 期間のキー。クライアントの入力なので絞る
 * @param reason - 付与の理由
 * @param message - 通知に出す文。空なら既定の文面
 */
export async function grantBenefits(
  targetUserId: string,
  duration: string,
  reason: string,
  message = "",
): Promise<ActionResult<GrantBenefitsError>> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) {
    return admin;
  }
  const { actorId, ipAddress } = admin;

  if (!isGrantDurationKey(duration)) {
    return { error: "invalidDuration" };
  }

  const trimmedReason = normalizeModerationReason(reason);
  if (trimmedReason === undefined) {
    return { error: "invalidReason" };
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > BENEFIT_GRANT_MESSAGE_MAX_LENGTH) {
    return { error: "invalidMessage" };
  }
  const notificationMessage =
    trimmedMessage === "" ? undefined : trimmedMessage;

  let granted: BenefitGrant | undefined;
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
          ...(notificationMessage === undefined
            ? {}
            : { message: notificationMessage }),
        },
      });
      granted = grant;
    });
  } catch (error) {
    logExternalError("grantBenefits", "failed to grant benefits", error);
    return { error: "grantFailed" };
  }

  if (granted) {
    await notifyQuietly({
      userId: targetUserId,
      type: NotificationType.BenefitGranted,
      target: { type: NotificationTargetType.BenefitGrant, id: granted.id },
      metadata: {
        plan: granted.plan,
        expiresAt: granted.expiresAt?.toISOString(),
        message: notificationMessage,
      },
    });
  }

  revalidateBenefitGrantViews();
  return { success: true };
}
