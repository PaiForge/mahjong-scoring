"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { copyToTranslationRows } from "@/lib/ads/copy";
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
import { isAdSlot } from "@/lib/ads/registry";

/** 広告更新の失敗理由 */
export type UpdateAdCreativeError =
  AdCreativeValidationError | "errorSaveFailed" | "errorNotFound";

/**
 * 広告を更新する
 * 広告更新
 *
 * スロットは作成時のまま動かさない（入力の slot は既存の行と一致する
 * 前提で検証にだけ使う）。別の画面に出したい広告は、そのスロットで作り直す。
 * スロットを移すと kind が変わりうるうえ、並び順も別のスロットの中で
 * 決め直す必要があるため。
 *
 * 文言は行ごと入れ替える（消したロケールの行を残さない）。
 */
export async function updateAdCreative(
  id: string,
  data: AdCreativeInput,
): Promise<ActionResult<UpdateAdCreativeError, { id: string }>> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;

  const [existing] = await db
    .select({ slot: adCreatives.slot })
    .from(adCreatives)
    .where(eq(adCreatives.id, id))
    .limit(1);
  if (!existing || !isAdSlot(existing.slot)) return { error: "errorNotFound" };
  const slot = existing.slot;

  const validated = validateAdCreative({ ...data, slot }, adImageUrlPrefix());
  if (!validated.ok) return { error: validated.error };
  const { value } = validated;

  await db.transaction(async (tx) => {
    await tx
      .update(adCreatives)
      .set({ ...toAdCreativeRow(value, slot), updatedAt: new Date() })
      .where(eq(adCreatives.id, id));
    await tx
      .delete(adCreativeTranslations)
      .where(eq(adCreativeTranslations.creativeId, id));
    await tx
      .insert(adCreativeTranslations)
      .values(copyToTranslationRows(id, value.copy));
  });

  revalidateAdCreatives();

  return { success: true, id };
}
