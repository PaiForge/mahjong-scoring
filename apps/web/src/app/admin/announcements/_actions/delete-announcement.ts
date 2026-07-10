"use server";

import { eq } from "drizzle-orm";

import { revalidateAnnouncementPaths } from "../_lib/announcement-row";

import type { ActionResult } from "@/lib/action-types";
import { announcements, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const admin = await requireAdminActor("errorDeleteFailed");
  if ("error" in admin) {
    return admin;
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

  revalidateAnnouncementPaths(existing.slug);

  return { success: true };
}
