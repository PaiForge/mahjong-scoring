"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { announcements, db } from "@/lib/db";
import { requireAdmin } from "@/app/admin/_lib/auth";

import {
  type AnnouncementInput,
  isUniqueViolation,
  validateAnnouncement,
} from "../_lib/validation";

export async function updateAnnouncement(
  id: string,
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

  const [existing] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!existing) {
    return { error: "errorNotFound" };
  }

  try {
    await db
      .update(announcements)
      .set({
        slug: data.slug,
        title: data.title,
        content: data.content,
        locale: data.locale,
        status: data.status,
        pinnedAt: data.pinned ? new Date() : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id));
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return { error: "errorDuplicate" };
    }
    throw err;
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${data.slug}`);

  return { success: true, id };
}
