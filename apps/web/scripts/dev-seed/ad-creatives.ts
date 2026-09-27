/**
 * ローカル開発用シードのネイティブ広告
 * シード広告
 *
 * 広告は掲載中のものが無いと画面に何も出ず、配置や見た目を確かめられない。
 * スロットごとに掲載中のサンプルを 1 件ずつ入れる。
 *
 * 練習一覧のスロットだけは手牌を持つ広告にする（牌効率・何切る系の本を
 * 載せる枠で、練習カードと同じ緑の帯に手牌が並ぶ）。他のカード型の
 * スロットは絵文字のままにし、両方の見た目を確かめられるようにする。
 *
 * @design id はスロットから決まる
 *
 * 何度実行しても同じ行を上書きし、増やさない。管理画面で編集した内容は
 * 次の実行で宣言された状態に戻る（他のシードと同じ扱い）。シード以外の
 * 広告には触れない。
 */
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  AD_SLOT_VALUES,
  kindForSlot,
  type AdSlot,
} from "../../src/lib/ads/registry";
import { adCreatives, adCreativeTranslations } from "../../src/lib/db/schema";

/** スロットの並びから決まるシード広告の id */
function seedCreativeId(index: number): string {
  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

/** 手牌を持つサンプルにするスロットと、その手牌（何切るの 14 枚） */
const HAND_SAMPLES: Partial<Record<AdSlot, string>> = {
  "practice-grid-native-ad": "234m45567p3468s11z",
};

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
    const hand = HAND_SAMPLES[slot] ?? null;
    const row = {
      id,
      kind: kindForSlot(slot),
      slot,
      href: "https://www.amazon.co.jp/",
      isActive: true,
      // シード以外の広告より前に出す（並び順の先頭が掲載される）
      sortOrder: -1,
      icon: hand === null ? "📘" : null,
      imagePath: null,
      imageAlt: null,
      hand,
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
      title:
        hand === null
          ? "麻雀の点数計算がわかる本（サンプル広告）"
          : "何切る問題集（サンプル広告）",
      description: `開発用のサンプルです（${slot}）。管理画面の /admin/ads で差し替えられます。`,
    });
  }
  return AD_SLOT_VALUES.length;
}
