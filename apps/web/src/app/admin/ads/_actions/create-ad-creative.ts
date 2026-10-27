"use server";

import { eq, max } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { copyToTranslationRows } from "@/lib/ads/copy";
import { isAdSlot } from "@/lib/ads/registry";
import { getClientIp } from "@/lib/client-ip";
import { adCreatives, adCreativeTranslations, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

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
 * 並び順はスロットの末尾（既存の最大 + 1）。本体と文言の行と監査ログを 1 つの
 * トランザクションで書く — 文言の無い広告は描画されないため、片方だけ
 * 残る状態を作らない。監査ログには作った行の値（`after`）を残す。
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
  const ipAddress = await getClientIp();

  const id = await db.transaction(async (tx) => {
    const [last] = await tx
      .select({ sortOrder: max(adCreatives.sortOrder) })
      .from(adCreatives)
      .where(eq(adCreatives.slot, slot));
    const row = {
      ...toAdCreativeRow(value, slot),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    };
    const [inserted] = await tx
      .insert(adCreatives)
      .values(row)
      .returning({ id: adCreatives.id });
    await tx
      .insert(adCreativeTranslations)
      .values(copyToTranslationRows(inserted.id, value.copy));
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.CreateAdCreative,
      target: { type: ContentActionTargetType.AdCreative, key: inserted.id },
      ipAddress,
      metadata: { after: { ...row, copy: value.copy } },
    });
    return inserted.id;
  });

  revalidateAdCreatives();

  return { success: true, id };
}
