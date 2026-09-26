import "server-only";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** ネイティブ広告の画像を置く Storage バケット */
export const AD_IMAGE_BUCKET = "ad-creatives";

/**
 * ad-creatives バケットの公開 URL の接頭辞
 * 広告画像URL接頭辞
 *
 * 保存する画像 URL がこのバケットのものかを検証するのに使う
 * （`validateAdCreative`）。
 */
export function adImageUrlPrefix(): string {
  const { url } = getSupabasePublicEnv();
  return `${url}/storage/v1/object/public/${AD_IMAGE_BUCKET}/`;
}
