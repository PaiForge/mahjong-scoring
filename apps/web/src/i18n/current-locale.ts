import "server-only";

import { getLocale } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 今のリクエストの言語（未対応の値なら既定の言語）
 * 現在ロケール取得
 *
 * next-intl の `getLocale()` は string を返すので、対応言語に絞る。
 *
 * 多くのページが使う共有の部品（練習の説明・結果のページ等）は、locale を props で
 * 通さずにこれで自分の言語を取る。props で通すと、部品の API を変えるたびに呼び出し側の
 * ページを全部書き換えることになるため。
 *
 * **ページの `prepareRouteLocale`（`setRequestLocale`）の後で呼ぶこと。** next-intl は
 * `setRequestLocale` 済みならその値を返し headers を読まない。先に呼ぶと headers を読み、
 * 静的生成を失う（ページが動的になる）。
 */
export async function currentLocale(): Promise<SupportedLocale> {
  const locale = await getLocale();
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
