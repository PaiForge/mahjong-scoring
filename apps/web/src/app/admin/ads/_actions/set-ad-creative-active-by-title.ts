"use server";

import { inArray } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { creativeIdsWithTitle } from "../_lib/creatives-by-title";
import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * タイトルが `title` の広告すべての掲載 / 停止を切り替える
 * タイトル別掲載一括切替
 *
 * 1 冊の本を全スロットでまとめて出す・止める。変えるのは掲載状態だけ。
 */
export async function setAdCreativeActiveByTitle(
  title: string,
  isActive: boolean,
): Promise<
  ActionResult<"errorSaveFailed" | "errorNotFound", { updated: number }>
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "") return { error: "errorNotFound" };

  const updated = await db
    .update(adCreatives)
    .set({ isActive, updatedAt: new Date() })
    .where(inArray(adCreatives.id, creativeIdsWithTitle(title)))
    .returning({ id: adCreatives.id });
  if (updated.length === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated: updated.length };
}
