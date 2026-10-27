"use server";

import { eq } from "drizzle-orm";

import { revalidateAnnouncementPaths } from "../_lib/announcement-row";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { announcements, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

/** お知らせ削除の失敗理由 */
export type DeleteAnnouncementError = "errorDeleteFailed" | "errorNotFound";

/**
 * お知らせを削除する
 * お知らせ削除
 *
 * 物理削除で、本文は他に残らない。`DELETE ... RETURNING` で消した行を受け取り、
 * 監査ログの `before` に行ごと残す（消した後に何を消したか・戻すにはどう書くかが
 * 分かる唯一の手がかり）。削除と記録は 1 つのトランザクション。
 */
export async function deleteAnnouncement(
  id: string,
): Promise<ActionResult<DeleteAnnouncementError>> {
  const admin = await requireAdminActor("errorDeleteFailed");
  if ("error" in admin) {
    return admin;
  }
  const ipAddress = await getClientIp();

  const deleted = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();
    if (!row) return undefined;
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.DeleteAnnouncement,
      target: { type: ContentActionTargetType.Announcement, key: id },
      ipAddress,
      metadata: { before: row },
    });
    return row;
  });

  if (!deleted) {
    return { error: "errorNotFound" };
  }

  revalidateAnnouncementPaths(deleted.slug);

  return { success: true };
}
