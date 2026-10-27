"use server";

import { and, inArray, isNotNull } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { isAdPlatform, slotsForPlatform } from "@/lib/ads/registry";
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
import { isValidAdHref } from "../_lib/validation";

/**
 * タイトルが `title` の広告のうち、`platform`（web / アプリ）のスロットの
 * 行すべてのリンクを `href` にする
 * タイトル別リンク一括更新
 *
 * 1 冊の本の、片方のプラットフォームの全スロットの行をまとめて書き換える
 * （`CreativeTitleGroup` 参照）。両方まとめては貼らない — リンクのトラッキング
 * ID はプラットフォームごとに違う。変えるのはリンクだけで、掲載状態・並び順
 * などはそのまま。
 *
 * 書き換えるのは URL を持つ行だけ。ASIN で指す行はリンクを持たない
 * （トラッキング ID と組み立てる）ので触れない。
 *
 * リンクは収益の行き先なので、監査ログに行ごとの書き換える前の URL（`before`）と
 * 新しい URL（`after`）を残す。
 */
export async function setAdCreativeHrefByTitle(
  title: string,
  platform: string,
  href: string,
): Promise<
  ActionResult<
    "errorSaveFailed" | "errorNotFound" | "errorHrefInvalid",
    { updated: number }
  >
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "" || !isAdPlatform(platform)) {
    return { error: "errorNotFound" };
  }
  const trimmed = href.trim();
  if (!isValidAdHref(trimmed)) return { error: "errorHrefInvalid" };
  const ipAddress = await getClientIp();

  const condition = and(
    inArray(adCreatives.id, creativeIdsWithTitle(title)),
    inArray(adCreatives.slot, slotsForPlatform(platform)),
    isNotNull(adCreatives.href),
  );

  const updated = await db.transaction(async (tx) => {
    const before = await tx
      .select({ id: adCreatives.id, href: adCreatives.href })
      .from(adCreatives)
      .where(condition)
      .for("update");
    if (before.length === 0) return 0;
    const rows = await tx
      .update(adCreatives)
      .set({ href: trimmed, updatedAt: new Date() })
      .where(condition)
      .returning({ id: adCreatives.id });
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.SetAdCreativeHrefByTitle,
      target: { type: ContentActionTargetType.AdTitle, key: title },
      ipAddress,
      metadata: { platform, before, after: trimmed },
    });
    return rows.length;
  });
  if (updated === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated };
}
