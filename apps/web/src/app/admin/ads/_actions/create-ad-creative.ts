"use server";

import { eq, max } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { copyToTranslationRows } from "@/lib/ads/copy";
import { isAdSlot } from "@/lib/ads/registry";
import { adCreatives, adCreativeTranslations, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { toAdCreativeRow } from "../_lib/creative-row";
import { adImageUrlPrefix } from "../_lib/image-url";
import { revalidateAdCreatives } from "../_lib/revalidate";
import {
  type AdCreativeInput,
  type AdCreativeValidationError,
  validateAdCreative,
} from "../_lib/validation";

/** 広告作成の失敗理由 */
export type CreateAdCreativeError =
  AdCreativeValidationError | "errorSaveFailed";

/**
 * 広告を作成する
 * 広告作成
 *
 * 並び順はスロットの末尾（既存の最大 + 1）。本体と文言の行を 1 つの
 * トランザクションで書く — 文言の無い広告は描画されないため、片方だけ
 * 残る状態を作らない。
 */
export async function createAdCreative(
  data: AdCreativeInput,
): Promise<ActionResult<CreateAdCreativeError, { id: string }>> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;

  const validated = validateAdCreative(data, adImageUrlPrefix());
  if (!validated.ok) return { error: validated.error };
  const { value } = validated;
  if (!isAdSlot(value.slot)) return { error: "errorSlotInvalid" };
  const slot = value.slot;

  const id = await db.transaction(async (tx) => {
    const [last] = await tx
      .select({ sortOrder: max(adCreatives.sortOrder) })
      .from(adCreatives)
      .where(eq(adCreatives.slot, slot));
    const [inserted] = await tx
      .insert(adCreatives)
      .values({
        ...toAdCreativeRow(value, slot),
        sortOrder: (last?.sortOrder ?? -1) + 1,
      })
      .returning({ id: adCreatives.id });
    await tx
      .insert(adCreativeTranslations)
      .values(copyToTranslationRows(inserted.id, value.copy));
    return inserted.id;
  });

  revalidateAdCreatives();

  return { success: true, id };
}
