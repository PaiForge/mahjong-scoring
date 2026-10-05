import { revalidatePath, updateTag } from "next/cache";

import { AD_CREATIVES_CACHE_TAG } from "@/lib/cache-tags";

/**
 * 広告の書き込み後のキャッシュ無効化
 * 広告再検証
 *
 * 広告を出す各画面は `AD_CREATIVES_CACHE_TAG` のキャッシュから読む
 * （`lib/ads/creatives.ts`）。書き込みのたびにタグを捨てないと、静的ページは
 * 1 日古い広告を出し続ける。書き込みはすべて Server Action なので、次の
 * リクエストで確実に新しい値を読む `updateTag` を使う。
 *
 * 広告を書き換えるアクションは必ずこれを呼ぶこと。
 */
export function revalidateAdCreatives(): void {
  updateTag(AD_CREATIVES_CACHE_TAG);
  revalidatePath("/admin/ads");
}
