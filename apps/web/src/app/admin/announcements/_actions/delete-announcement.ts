"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { announcements, db } from "@/lib/db";
import { requireAdmin } from "@/app/admin/_lib/auth";

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const adminResult = await requireAdmin();
  if ("error" in adminResult) {
    return { error: "errorDeleteFailed" };
  }

  const [existing] = await db
    .select({ slug: announcements.slug })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!existing) {
    return { error: "errorNotFound" };
  }

  await db.delete(announcements).where(eq(announcements.id, id));

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${existing.slug}`);

  return { success: true };
}
