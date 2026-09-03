"use server";

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

export async function createAnnouncement(
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

  const now = new Date();

  let inserted: { id: string };
  try {
    [inserted] = await db
      .insert(announcements)
      .values(toAnnouncementRow(data, now))
      .returning({ id: announcements.id });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }

  revalidateAnnouncementPaths(data.slug);

  return { success: true, id: inserted.id };
}
