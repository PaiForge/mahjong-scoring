import { usePathname } from "next/navigation";

import { parseExternalPath } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 今のページの言語（クライアントの練習の部品）
 * ページ言語取得
 *
 * 練習の共有部品は locale を props で受け取らず、これで自分の言語を取る
 * （サーバーの `currentLocale()` と同じ方針。props で通すと部品の API を変えるたびに
 * 呼び出し側の練習を全部書き換えることになる）。
 *
 * @design next-intl の `useLocale()` ではなく URL から読む
 * このアプリの言語は URL の接頭辞だけで決まる（`routing.ts`。`/en/...` が英語、
 * 接頭辞なしが日本語）ので、`usePathname()`（next/navigation。アドレスバーの形）を
 * `parseExternalPath` で読めば `useLocale()` と同じ値になる。URL から読むのは、
 * 盤面の奥の部品（手牌・残り回数）が next-intl を差し替えたテストの中でも描かれ、
 * そこでは `useLocale` が用意されていないため。`usePathname()` が null を返す
 * 場面（App Router の外）では既定の言語にする。
 *
 * `"use client"` は付けない。呼び出し元の盤面（クライアント）に取り込まれて動く。
 */
export function usePageLocale(): SupportedLocale {
  // 型は string だが、App Router の外（テスト等）では null が返る
  const pathname: string | null = usePathname();
  return pathname === null
    ? DEFAULT_LOCALE
    : parseExternalPath(pathname).locale;
}
