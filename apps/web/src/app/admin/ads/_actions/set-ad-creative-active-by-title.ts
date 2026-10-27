"use server";

import { and, inArray } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import {
  AD_SLOT_VALUES,
  isAdPlatform,
  slotsForPlatform,
} from "@/lib/ads/registry";
import { getClientIp } from "@/lib/client-ip";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

import { creativeIdsWithTitle } from "../_lib/creatives-by-title";
import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * タイトルが `title` の広告の掲載 / 停止を切り替える
 * タイトル別掲載一括切替
 *
 * 1 冊の本を全スロットでまとめて出す・止める。`platform` を渡せば、その
 * プラットフォーム（web / アプリ）のスロットの行だけ。変えるのは掲載状態だけ。
 * 行ごとに前の掲載状態は違いうるので、監査ログの `before` は行の配列。
 */
export async function setAdCreativeActiveByTitle(
  title: string,
  isActive: boolean,
  platform?: string,
): Promise<
  ActionResult<"errorSaveFailed" | "errorNotFound", { updated: number }>
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "") return { error: "errorNotFound" };
  if (platform !== undefined && !isAdPlatform(platform)) {
    return { error: "errorNotFound" };
  }
  const ipAddress = await getClientIp();

  const condition = and(
    inArray(adCreatives.id, creativeIdsWithTitle(title)),
    // 画面が束ねるのはスロットの定義にある行だけ（数と適用先を揃える）
    inArray(
      adCreatives.slot,
      platform === undefined ? AD_SLOT_VALUES : slotsForPlatform(platform),
    ),
  );

  const updated = await db.transaction(async (tx) => {
    const before = await tx
      .select({ id: adCreatives.id, isActive: adCreatives.isActive })
      .from(adCreatives)
      .where(condition)
      .for("update");
    if (before.length === 0) return 0;
    const rows = await tx
      .update(adCreatives)
      .set({ isActive, updatedAt: new Date() })
      .where(condition)
      .returning({ id: adCreatives.id });
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.SetAdCreativeActiveByTitle,
      target: { type: ContentActionTargetType.AdTitle, key: title },
      ipAddress,
      metadata: { platform, before, after: isActive },
    });
    return rows.length;
  });
  if (updated === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated };
}
