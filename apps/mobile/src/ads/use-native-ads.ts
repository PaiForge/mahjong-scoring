import { useEffect, useState } from "react";
import {
  nativeAdsApiPath,
  type MobileAdSlot,
  type NativeAdView,
} from "@mahjong-scoring/features/ads/native-ad";
import { parseNativeAdsResponse } from "@mahjong-scoring/features/ads/parse-native-ads-response";

import { SITE_URL } from "../lib/app-site-url";

/**
 * スロットの広告を web の広告配信 API から読む
 * 広告取得フック
 *
 * 読み終えるまで・失敗したとき・形が合わないときは空配列（広告を出さない）。
 * web と同じく、広告の失敗で画面を落とさない。読むのは画面を開いたときに
 * 1 回だけで、管理画面での変更は次に画面を開いたときに届く。返すのは画面に
 * 出す分（スロットの枠数まで、並び順どおり）。
 */
export function useNativeAds(slot: MobileAdSlot): readonly NativeAdView[] {
  const [ads, setAds] = useState<readonly NativeAdView[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${SITE_URL}${nativeAdsApiPath(slot)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const parsed = parseNativeAdsResponse(await response.json());
        if (parsed !== undefined) setAds(parsed.ads);
      })
      .catch(() => {
        // 通信できない・中断した・JSON でない。広告を出さないだけでよい
      });
    return () => controller.abort();
  }, [slot]);

  return ads;
}
