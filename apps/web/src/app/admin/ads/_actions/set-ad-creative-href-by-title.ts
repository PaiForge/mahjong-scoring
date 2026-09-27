"use server";

import { inArray } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { creativeIdsWithTitle } from "../_lib/creatives-by-title";
import { revalidateAdCreatives } from "../_lib/revalidate";
import { isValidAdHref } from "../_lib/validation";

/**
 * タイトルが `title` の広告すべてのリンクを `href` にする
 * タイトル別リンク一括更新
 *
 * 1 冊の本の、全スロットの行をまとめて書き換える（`CreativeTitleGroup` 参照）。
 * 変えるのはリンクだけで、掲載状態・並び順などはそのまま。
 */
export async function setAdCreativeHrefByTitle(
  title: string,
  href: string,
): Promise<
  ActionResult<
    "errorSaveFailed" | "errorNotFound" | "errorHrefInvalid",
    { updated: number }
  >
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "") return { error: "errorNotFound" };
  const trimmed = href.trim();
  if (!isValidAdHref(trimmed)) return { error: "errorHrefInvalid" };

  const updated = await db
    .update(adCreatives)
    .set({ href: trimmed, updatedAt: new Date() })
    .where(inArray(adCreatives.id, creativeIdsWithTitle(title)))
    .returning({ id: adCreatives.id });
  if (updated.length === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated: updated.length };
}
