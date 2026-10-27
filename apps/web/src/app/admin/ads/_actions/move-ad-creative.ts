"use server";

import { asc, eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { adCreatives, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

import { moveInOrder, type MoveDirection } from "../_lib/reorder";
import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * 広告をスロット内で 1 つ上 / 下へ動かす
 * 広告並び替え
 *
 * 画面に出るのは各スロットの先頭の 1 件なので、並べ替えは「どれを掲載するか」
 * の操作でもある。スロット全体の並びを連番で書き直し、監査ログに動かす前後の
 * 並び（id の列）を残す。端にあって動かせなかったときは何も書かず、記録もしない。
 */
export async function moveAdCreative(
  id: string,
  direction: MoveDirection,
): Promise<ActionResult<"errorSaveFailed" | "errorNotFound">> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  const ipAddress = await getClientIp();

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
    const before = rows.map((row) => row.id);
    const next = moveInOrder(before, id, direction);
    if (next === undefined) return true;

    for (const [sortOrder, rowId] of next.entries()) {
      await tx
        .update(adCreatives)
        .set({ sortOrder })
        .where(eq(adCreatives.id, rowId));
    }
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.MoveAdCreative,
      target: { type: ContentActionTargetType.AdCreative, key: id },
      ipAddress,
      metadata: { slot: target.slot, direction, before, after: next },
    });
    return true;
  });
  if (!moved) return { error: "errorNotFound" };

  revalidateAdCreatives();

  return { success: true };
}
