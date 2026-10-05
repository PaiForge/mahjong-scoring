"use server";

import { asc, eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { moveInOrder, type MoveDirection } from "../_lib/reorder";
import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * 広告をスロット内で 1 つ上 / 下へ動かす
 * 広告並び替え
 *
 * 画面に出るのは各スロットの先頭の 1 件なので、並べ替えは「どれを掲載するか」
 * の操作でもある。スロット全体の並びを連番で書き直す。
 */
export async function moveAdCreative(
  id: string,
  direction: MoveDirection,
): Promise<ActionResult<"errorSaveFailed" | "errorNotFound">> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;

  const moved = await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ slot: adCreatives.slot })
      .from(adCreatives)
      .where(eq(adCreatives.id, id))
      .limit(1);
    if (!target) return false;

    const rows = await tx
      .select({ id: adCreatives.id })
      .from(adCreatives)
      .where(eq(adCreatives.slot, target.slot))
      .orderBy(asc(adCreatives.sortOrder), asc(adCreatives.createdAt));
    const next = moveInOrder(
      rows.map((row) => row.id),
      id,
      direction,
    );
    if (next === undefined) return true;

    for (const [sortOrder, rowId] of next.entries()) {
      await tx
        .update(adCreatives)
        .set({ sortOrder })
        .where(eq(adCreatives.id, rowId));
    }
    return true;
  });
  if (!moved) return { error: "errorNotFound" };

  revalidateAdCreatives();

  return { success: true };
}
