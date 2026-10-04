import { inArray } from "drizzle-orm";

import { adCreativeTranslations, db } from "@/lib/db";

import { copyFromTranslationRows, type CreativeCopy } from "./copy";

/**
 * 広告の文言を全ロケール分まとめて読む
 * 広告文言読み込み
 *
 * 閲覧画面（`creatives.ts`）と管理画面（`admin/ads/_lib/queries.ts`）が
 * 同じ形で読む。文言の行を 1 つも持たない広告はマップに載らない。
 *
 * @param creativeIds - 読む広告の id
 */
export async function loadCreativeCopy(
  creativeIds: readonly string[],
): Promise<Map<string, CreativeCopy>> {
  if (creativeIds.length === 0) return new Map();
  const copyRows = await db
    .select({
      creativeId: adCreativeTranslations.creativeId,
      locale: adCreativeTranslations.locale,
      title: adCreativeTranslations.title,
      description: adCreativeTranslations.description,
    })
    .from(adCreativeTranslations)
    .where(inArray(adCreativeTranslations.creativeId, [...creativeIds]));
  return copyFromTranslationRows(copyRows);
}
