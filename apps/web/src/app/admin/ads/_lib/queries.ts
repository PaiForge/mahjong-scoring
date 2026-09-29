import { asc, eq, inArray } from "drizzle-orm";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { AMAZON_NETWORK } from "@/lib/ads/amazon";
import { copyFromTranslationRows, type CreativeCopy } from "@/lib/ads/copy";
import {
  type AdCreative,
  adCreatives,
  adCreativeTranslations,
  adNetworkSettings,
  db,
} from "@/lib/db";

/** 管理画面の一覧・編集で扱う広告（本体 + 全ロケールの文言） */
export interface AdminAdCreative {
  readonly row: AdCreative;
  readonly copy: CreativeCopy;
}

const EMPTY_COPY: CreativeCopy = { title: {}, description: {} };

async function withCopy(
  rows: readonly AdCreative[],
): Promise<AdminAdCreative[]> {
  if (rows.length === 0) return [];
  const copyRows = await db
    .select({
      creativeId: adCreativeTranslations.creativeId,
      locale: adCreativeTranslations.locale,
      title: adCreativeTranslations.title,
      description: adCreativeTranslations.description,
    })
    .from(adCreativeTranslations)
    .where(
      inArray(
        adCreativeTranslations.creativeId,
        rows.map((row) => row.id),
      ),
    );
  const copyById = copyFromTranslationRows(copyRows);
  return rows.map((row) => ({ row, copy: copyById.get(row.id) ?? EMPTY_COPY }));
}

/**
 * すべての広告（停止中も含む）をスロット・並び順で
 * 管理用広告一覧取得
 */
export async function getAllAdCreatives(): Promise<AdminAdCreative[]> {
  const rows = await db
    .select()
    .from(adCreatives)
    .orderBy(
      asc(adCreatives.slot),
      asc(adCreatives.sortOrder),
      asc(adCreatives.createdAt),
    );
  return withCopy(rows);
}

/** 広告 1 件。無ければ undefined */
export async function getAdCreativeById(
  id: string,
): Promise<AdminAdCreative | undefined> {
  const rows = await db
    .select()
    .from(adCreatives)
    .where(eq(adCreatives.id, id))
    .limit(1);
  const [creative] = await withCopy(rows);
  return creative;
}

/** 一覧に出す見出し（既定ロケールのタイトル） */
export function adminCreativeLabel(copy: CreativeCopy): string {
  return copy.title[DEFAULT_LOCALE] ?? "";
}

/** Amazon のトラッキング ID（キャッシュを通さない）。未設定なら undefined */
export async function getAmazonTrackingId(): Promise<string | undefined> {
  const [row] = await db
    .select({ trackingId: adNetworkSettings.trackingId })
    .from(adNetworkSettings)
    .where(eq(adNetworkSettings.network, AMAZON_NETWORK))
    .limit(1);
  return row?.trackingId;
}
