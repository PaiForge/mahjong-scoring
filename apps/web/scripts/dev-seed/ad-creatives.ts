/**
 * ローカル開発用シードのネイティブ広告
 * シード広告
 *
 * 本番のシード（`scripts/seed/ad-creatives.ts`）と同じ本・同じ id の広告を、
 * 掲載中にして入れる。本番のシードは停止中で入るため、そのままでは画面に
 * 何も出ず、配置や見た目を確かめられない。リンクは仮リンクのままで、押すと
 * `example.com` に飛ぶ（ローカルでだけ、仮リンクのまま掲載にしている）。
 *
 * 何度実行しても宣言された状態に戻す（他のシードと同じ扱い）。管理画面で
 * 編集した内容は次の実行で戻る。シード以外の広告には触れない。
 *
 * 以前のサンプル広告（id が `00000000-0000-4000-8…` のもの）は消す。
 */
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { copyToTranslationRows } from "../../src/lib/ads/copy";
import { adCreatives, adCreativeTranslations } from "../../src/lib/db/schema";
import { SEED_AD_CREATIVES } from "../seed/ad-creatives";

/** 以前のサンプル広告の id の接頭辞 */
const LEGACY_SAMPLE_ID_PREFIX = "00000000-0000-4000-8";

/**
 * 本番シードの広告を掲載中で入れ直す（冪等）
 *
 * @returns 投入した広告の数
 */
export async function reseedAdCreatives(
  db: PostgresJsDatabase,
): Promise<number> {
  // 翻訳は外部キーの cascade で一緒に消える
  await db
    .delete(adCreatives)
    // id は uuid 型で LIKE を持たないため、文字列にして比べる
    .where(sql`${adCreatives.id}::text LIKE ${`${LEGACY_SAMPLE_ID_PREFIX}%`}`);

  for (const { row, copy } of SEED_AD_CREATIVES) {
    const active = { ...row, isActive: true };
    await db
      .insert(adCreatives)
      .values(active)
      .onConflictDoUpdate({ target: adCreatives.id, set: active });
    await db
      .delete(adCreativeTranslations)
      .where(eq(adCreativeTranslations.creativeId, row.id));
    const copyRows = copyToTranslationRows(row.id, copy);
    if (copyRows.length > 0) {
      await db.insert(adCreativeTranslations).values(copyRows);
    }
  }
  return SEED_AD_CREATIVES.length;
}
