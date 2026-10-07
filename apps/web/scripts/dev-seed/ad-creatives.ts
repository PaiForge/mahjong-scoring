/**
 * ローカル開発用シードのネイティブ広告
 * シード広告
 *
 * 本番のシード（`scripts/seed/ad-creatives.ts`）と同じ本・同じ id の広告を
 * 入れ、ローカル用のトラッキング ID（{@link DEV_TRACKING_IDS}。web とモバイルで
 * 別の値）を設定する。値を分けておくのは、リンクの `tag=` を見るだけで
 * どちらの ID で組み立てたかを確かめられるようにするため。
 * ASIN の広告はトラッキング ID が無いと画面に出ないため、これが無いと配置や
 * 見た目を確かめられない。ID は架空の値で、押すと Amazon の商品ページに
 * その ID 付きで飛ぶ（成果はどこにも付かない）。
 *
 * 何度実行しても宣言された状態に戻す（他のシードと同じ扱い）。管理画面で
 * 編集した内容は次の実行で戻る。シード以外の広告には触れない。
 *
 * 以前のサンプル広告（id が `00000000-0000-4000-8…` のもの）は消す。
 */
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { copyToTranslationRows } from "../../src/lib/ads/copy";
import { AMAZON_NETWORK } from "../../src/lib/ads/amazon";
import { AD_PLATFORMS, type AdPlatform } from "../../src/lib/ads/registry";
import {
  adCreatives,
  adCreativeTranslations,
  adNetworkSettings,
} from "../../src/lib/db/schema";
import { SEED_AD_CREATIVES } from "../seed/ad-creatives";

/** ローカル用の架空のトラッキング ID（プラットフォームごと） */
export const DEV_TRACKING_IDS: Record<AdPlatform, string> = {
  web: "localdev-web-22",
  mobile: "localdev-app-22",
};

/** 以前のサンプル広告の id の接頭辞 */
const LEGACY_SAMPLE_ID_PREFIX = "00000000-0000-4000-8";

/**
 * 本番シードの広告とローカル用のトラッキング ID を入れ直す（冪等）
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

  for (const platform of AD_PLATFORMS) {
    const trackingId = DEV_TRACKING_IDS[platform];
    await db
      .insert(adNetworkSettings)
      .values({ network: AMAZON_NETWORK, platform, trackingId })
      .onConflictDoUpdate({
        target: [adNetworkSettings.network, adNetworkSettings.platform],
        set: { trackingId, updatedAt: new Date() },
      });
  }

  for (const { row, copy } of SEED_AD_CREATIVES) {
    await db
      .insert(adCreatives)
      .values(row)
      .onConflictDoUpdate({ target: adCreatives.id, set: row });
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
