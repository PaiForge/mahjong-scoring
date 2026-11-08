import { useLocale } from "next-intl";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 今のページの言語（認証のクライアント部品）
 * 認証ページ言語取得
 *
 * next-intl の `useLocale()` は string を返すので、対応言語に絞る（サーバーの
 * `currentLocale()` と同じ規則。未対応の値は既定の言語）。ログインの成功後の
 * `window.location.href` や OAuth の `redirectTo` のように、next-intl の遷移を
 * 通らない URL を組む部品が、`localizedHref` に渡すために使う。
 *
 * `"use client"` は付けない。呼び出し元のクライアント部品に取り込まれて動く。
 */
export function useSupportedLocale(): SupportedLocale {
  const locale = useLocale();
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
