"use server";

import { inArray } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { isPlaceholderAdHref } from "@/lib/ads/placeholder";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { creativeIdsWithTitle } from "../_lib/creatives-by-title";
import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * タイトルが `title` の広告すべての掲載 / 停止を切り替える
 * タイトル別掲載一括切替
 *
 * 1 冊の本を全スロットでまとめて出す・止める。変えるのは掲載状態だけ。
 *
 * 掲載は、1 行でも仮リンクのまま（`isPlaceholderAdHref`）ならまとめて断る。
 * 準備のできた行だけを掲載すると、リンクを貼り忘れた 1 スロットだけが暗いまま
 * 成功と表示され、本番の画面からは気づけない。停止は常にできる。
 */
export async function setAdCreativeActiveByTitle(
  title: string,
  isActive: boolean,
): Promise<
  ActionResult<
    "errorSaveFailed" | "errorNotFound" | "errorHrefPlaceholder",
    { updated: number }
  >
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "") return { error: "errorNotFound" };

  const matching = creativeIdsWithTitle(title);
  if (isActive) {
    const rows = await db
      .select({ href: adCreatives.href })
      .from(adCreatives)
      .where(inArray(adCreatives.id, matching));
    if (rows.some((row) => isPlaceholderAdHref(row.href))) {
      return { error: "errorHrefPlaceholder" };
    }
  }

  const updated = await db
    .update(adCreatives)
    .set({ isActive, updatedAt: new Date() })
    .where(inArray(adCreatives.id, matching))
    .returning({ id: adCreatives.id });
  if (updated.length === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated: updated.length };
}
