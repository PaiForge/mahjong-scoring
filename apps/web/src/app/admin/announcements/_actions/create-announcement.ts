"use server";

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

/** お知らせ作成の失敗理由 */
export type CreateAnnouncementError =
  AnnouncementValidationError | "errorSaveFailed" | "errorDuplicate";

/**
 * お知らせを作成する
 * お知らせ作成
 *
 * 行の INSERT と監査ログ（作った行の値を `after` に）を 1 つのトランザクションで書く。
 */
export async function createAnnouncement(
  data: AnnouncementInput,
): Promise<ActionResult<CreateAnnouncementError, { id: string }>> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) {
    return admin;
  }

  const validationError = validateAnnouncement(data);
  if (validationError) {
    return { error: validationError };
  }

  const now = new Date();
  const ipAddress = await getClientIp();

  let inserted: { id: string };
  try {
    inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(announcements)
        // 新規作成なので、引き継ぐピン留め時刻は無い
        .values(toAnnouncementRow(data, { now, currentPinnedAt: null }))
        .returning();
      await recordContentAction(tx, {
        actorId: admin.actorId,
        action: ContentActionKind.CreateAnnouncement,
        target: { type: ContentActionTargetType.Announcement, key: row.id },
        ipAddress,
        metadata: { after: row },
      });
      return row;
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }

  revalidateAnnouncementPaths(data.slug);

  return { success: true, id: inserted.id };
}
