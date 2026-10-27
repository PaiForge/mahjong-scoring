"use server";

import { eq } from "drizzle-orm";

import { isUniqueViolation } from "@/lib/db/extract-pg-error-code";
import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { announcements, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

import {
  revalidateAnnouncementPaths,
  toAnnouncementRow,
} from "../_lib/announcement-row";
import {
  type AnnouncementInput,
  type AnnouncementValidationError,
  validateAnnouncement,
} from "../_lib/validation";

/** お知らせ更新の失敗理由 */
export type UpdateAnnouncementError =
  | AnnouncementValidationError
  | "errorSaveFailed"
  | "errorNotFound"
  | "errorDuplicate";

/**
 * お知らせを更新する
 * お知らせ更新
 *
 * 更新前の行を押さえて読み、UPDATE と監査ログ（更新前後の行を `before` /
 * `after` に）を 1 つのトランザクションで書く。本文の差分は残さず行ごと残す
 * — 件数が少なく、差分は隣の記録と見比べれば出せる。
 */
export async function updateAnnouncement(
  id: string,
  data: AnnouncementInput,
): Promise<ActionResult<UpdateAnnouncementError, { id: string }>> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) {
    return admin;
  }

  const validationError = validateAnnouncement(data);
  if (validationError) {
    return { error: validationError };
  }

  // 行の各時刻（ピン留め・更新）を1つの「今」から揃える
  const now = new Date();
  const ipAddress = await getClientIp();

  let found: boolean;
  try {
    found = await db.transaction(async (tx) => {
      // pinnedAt も引く。ピン留めが続いている行の時刻を動かさないために要る
      const [before] = await tx
        .select()
        .from(announcements)
        .where(eq(announcements.id, id))
        .for("update");
      if (!before) return false;

      const [after] = await tx
        .update(announcements)
        .set({
          ...toAnnouncementRow(data, {
            now,
            currentPinnedAt: before.pinnedAt,
          }),
          updatedAt: now,
        })
        .where(eq(announcements.id, id))
        .returning();
      await recordContentAction(tx, {
        actorId: admin.actorId,
        action: ContentActionKind.UpdateAnnouncement,
        target: { type: ContentActionTargetType.Announcement, key: id },
        ipAddress,
        metadata: { before, after },
      });
      return true;
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }
  if (!found) {
    return { error: "errorNotFound" };
  }

  revalidateAnnouncementPaths(data.slug);

  return { success: true, id };
}
