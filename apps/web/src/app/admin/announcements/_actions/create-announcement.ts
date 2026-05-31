"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { announcements, db } from "@/lib/db";
import { requireAdmin } from "@/app/admin/_lib/auth";

import {
  type AnnouncementInput,
  isUniqueViolation,
  validateAnnouncement,
} from "../_lib/validation";

export async function createAnnouncement(
  data: AnnouncementInput,
): Promise<ActionResult<{ id: string }>> {
  const adminResult = await requireAdmin();
  if ("error" in adminResult) {
    return { error: "errorSaveFailed" };
  }

  const validationError = validateAnnouncement(data);
  if (validationError) {
    return { error: validationError };
  }

  let inserted: { id: string };
  try {
    [inserted] = await db
      .insert(announcements)
      .values({
        slug: data.slug,
        title: data.title,
        content: data.content,
        locale: data.locale,
        status: data.status,
        pinnedAt: data.pinned ? new Date() : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      })
      .returning({ id: announcements.id });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${data.slug}`);

  return { success: true, id: inserted.id };
}
