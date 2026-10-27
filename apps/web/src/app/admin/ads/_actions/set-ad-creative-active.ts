"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * 広告の掲載 / 停止を切り替える
 * 広告掲載切替
 *
 * 削除の操作は持たない。掲載をやめた広告は停止にして残す（`ad_creatives` の
 * TSDoc 参照）。監査ログには切り替える前後の掲載状態を残す。
 */
export async function setAdCreativeActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult<"errorSaveFailed" | "errorNotFound">> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  const ipAddress = await getClientIp();

  const updated = await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ isActive: adCreatives.isActive })
      .from(adCreatives)
      .where(eq(adCreatives.id, id))
      .for("update");
    if (!before) return false;
    await tx
      .update(adCreatives)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(adCreatives.id, id));
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.SetAdCreativeActive,
      target: { type: ContentActionTargetType.AdCreative, key: id },
      ipAddress,
      metadata: { before: before.isActive, after: isActive },
    });
    return true;
  });
  if (!updated) return { error: "errorNotFound" };

  revalidateAdCreatives();

  return { success: true };
}
