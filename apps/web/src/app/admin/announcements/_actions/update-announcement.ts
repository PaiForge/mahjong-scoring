"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { announcements, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import {
  revalidateAnnouncementPaths,
  toAnnouncementRow,
} from "../_lib/announcement-row";
import {
  type AnnouncementInput,
  isUniqueViolation,
  validateAnnouncement,
} from "../_lib/validation";

export async function updateAnnouncement(
  id: string,
  data: AnnouncementInput,
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) {
    return admin;
  }

  const validationError = validateAnnouncement(data);
  if (validationError) {
    return { error: validationError };
  }

  const [existing] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!existing) {
    return { error: "errorNotFound" };
  }

  // 行の各時刻（ピン留め・更新）を1つの「今」から揃える
  const now = new Date();

  try {
    await db
      .update(announcements)
      .set({ ...toAnnouncementRow(data, now), updatedAt: now })
      .where(eq(announcements.id, id));
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }

  revalidateAnnouncementPaths(data.slug);

  return { success: true, id };
}
