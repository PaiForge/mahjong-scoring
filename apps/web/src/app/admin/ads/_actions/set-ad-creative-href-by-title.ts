"use server";

import { inArray } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { isPlaceholderAdHref } from "@/lib/ads/placeholder";
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
 * 並び順などはそのまま。`activate` を渡すと同じ書き込みで全行を掲載にする —
 * シードの広告（仮リンク・停止中）は、リンクを貼った時点で出せる状態になる
 * ため、貼る操作と出す操作を分けると 2 度手間になるだけ。
 *
 * 仮リンクを一括で書くことは断る。掲載中の行に書くと行き先の無い広告が
 * 本番に出る。止めたいなら掲載の切り替えを使う。
 */
export async function setAdCreativeHrefByTitle(
  title: string,
  href: string,
  activate: boolean,
): Promise<
  ActionResult<
    | "errorSaveFailed"
    | "errorNotFound"
    | "errorHrefInvalid"
    | "errorHrefPlaceholder",
    { updated: number }
  >
> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (title === "") return { error: "errorNotFound" };
  const trimmed = href.trim();
  if (!isValidAdHref(trimmed)) return { error: "errorHrefInvalid" };
  if (isPlaceholderAdHref(trimmed)) return { error: "errorHrefPlaceholder" };

  const updated = await db
    .update(adCreatives)
    .set({
      href: trimmed,
      ...(activate ? { isActive: true } : {}),
      updatedAt: new Date(),
    })
    .where(inArray(adCreatives.id, creativeIdsWithTitle(title)))
    .returning({ id: adCreatives.id });
  if (updated.length === 0) return { error: "errorNotFound" };

  revalidateAdCreatives();
  return { success: true, updated: updated.length };
}
