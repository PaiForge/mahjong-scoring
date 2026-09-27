"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { isPlaceholderAdHref } from "@/lib/ads/placeholder";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * 広告の掲載 / 停止を切り替える
 * 広告掲載切替
 *
 * 削除の操作は持たない。掲載をやめた広告は停止にして残す（`ad_creatives` の
 * TSDoc 参照）。
 *
 * 仮リンクのままの広告は掲載にできない（`isPlaceholderAdHref`）。停止は
 * どんな状態でも常にできる。
 */
export async function setAdCreativeActive(
  id: string,
  isActive: boolean,
): Promise<
  ActionResult<"errorSaveFailed" | "errorNotFound" | "errorHrefPlaceholder">
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;

  if (isActive) {
    const [row] = await db
      .select({ href: adCreatives.href })
      .from(adCreatives)
      .where(eq(adCreatives.id, id))
      .limit(1);
    if (!row) return { error: "errorNotFound" };
    if (isPlaceholderAdHref(row.href)) return { error: "errorHrefPlaceholder" };
  }

  const updated = await db
    .update(adCreatives)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(adCreatives.id, id))
    .returning({ id: adCreatives.id });
  if (updated.length === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();

  return { success: true };
}
