/**
 * ローカル開発用シードのネイティブ広告
 * シード広告
 *
 * 広告は掲載中のものが無いと画面に何も出ず、配置や見た目を確かめられない。
 * スロットごとに掲載中のサンプルを 1 件ずつ入れる。
 *
 * @design id はスロットから決まる
 *
 * 何度実行しても同じ行を上書きし、増やさない。管理画面で編集した内容は
 * 次の実行で宣言された状態に戻る（他のシードと同じ扱い）。シード以外の
 * 広告には触れない。
 */
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { AD_SLOT_VALUES, kindForSlot } from "../../src/lib/ads/registry";
import { adCreatives, adCreativeTranslations } from "../../src/lib/db/schema";

/** スロットの並びから決まるシード広告の id */
function seedCreativeId(index: number): string {
  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

/**
 * スロットごとのサンプル広告を投入する（冪等）
 *
 * @returns 投入した広告の数
 */
export async function reseedAdCreatives(
  db: PostgresJsDatabase,
): Promise<number> {
  for (const [index, slot] of AD_SLOT_VALUES.entries()) {
    const id = seedCreativeId(index);
    const row = {
      id,
      kind: kindForSlot(slot),
      slot,
      href: "https://www.amazon.co.jp/",
      isActive: true,
      // シード以外の広告より前に出す（並び順の先頭が掲載される）
      sortOrder: -1,
      icon: "📘",
      imagePath: null,
      imageAlt: null,
    };
    await db
      .insert(adCreatives)
      .values(row)
      .onConflictDoUpdate({ target: adCreatives.id, set: row });
    await db
      .delete(adCreativeTranslations)
      .where(eq(adCreativeTranslations.creativeId, id));
    await db.insert(adCreativeTranslations).values({
      creativeId: id,
      locale: "ja",
      title: "麻雀の点数計算がわかる本（サンプル広告）",
      description: `開発用のサンプルです（${slot}）。管理画面の /admin/ads で差し替えられます。`,
    });
  }
  return AD_SLOT_VALUES.length;
}
