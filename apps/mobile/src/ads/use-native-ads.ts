import { useEffect, useState } from "react";
import {
  nativeAdsApiPath,
  type MobileAdSlot,
  type NativeAdView,
} from "@mahjong-scoring/features/ads/native-ad";
import { parseNativeAdsResponse } from "@mahjong-scoring/features/ads/parse-native-ads-response";

import { useAppLocale } from "../lib/use-app-locale";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import { readPublicMobileApi } from "../auth/read-public-mobile-api";

/**
 * スロットの広告を web の広告配信 API から読む
 * 広告取得フック
 *
 * 読み終えるまで・失敗したとき・形が合わないときは空配列（広告を出さない）。
 * web と同じく、広告の失敗で画面を落とさない。読むのは画面を開いたときに
 * 1 回だけで、管理画面での変更は次に画面を開いたときに届く。返すのは画面に
 * 出す分（スロットの枠数まで、並び順どおり）。
 * 日本語の書籍広告は英語の利用者には配らない。web と同じく、日本語以外では
 * API も呼ばず空配列を返す。英語向け広告を提供する際は配信側の言語管理が必要。
 */
export function useNativeAds(slot: MobileAdSlot): readonly NativeAdView[] {
  const locale = useAppLocale();
  const [ads, setAds] = useState<readonly NativeAdView[]>([]);

  useEffect(() => {
    if (locale !== DEFAULT_LOCALE) return;
    const controller = new AbortController();
    // 通信できない・中断した・形が合わないときは undefined で、広告を出さないだけでよい
    void readPublicMobileApi(nativeAdsApiPath(slot), parseNativeAdsResponse, {
      signal: controller.signal,
    }).then((parsed) => {
      if (parsed !== undefined) setAds(parsed.ads);
    });
    return () => controller.abort();
  }, [slot, locale]);

  return locale === DEFAULT_LOCALE ? ads : [];
}
