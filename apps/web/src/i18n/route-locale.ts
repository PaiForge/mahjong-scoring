import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { getPublication } from "./route-policy";

/**
 * `app/[locale]` のページ・レイアウトの入口で、ロケールを検証して確定する
 * ルートロケール確定
 *
 * 1. `params.locale` が対応ロケール（`ja` / `en`）でなければ 404
 * 2. そのパスがその言語で `unpublished` なら 404（未訳の英語ページに
 *    日本語の本文を出さない。`route-policy.ts`）
 * 3. `setRequestLocale` でリクエストのロケールを確定し、静的生成を保つ
 *
 * 未公開の英語 URL は proxy が先に HTTP 404 を返すので、通常ここには来ない。
 * ここでも確かめるのは、proxy を通らない経路（matcher の変更・
 * 静的生成時の `generateStaticParams`）でも未訳ページを 200 で出さないため。
 * ページ側の `notFound()` は祖先の `loading.tsx` がヘッダを確定させた後だと
 * 200 になり得るので、HTTP の 404 は proxy が正。
 *
 * `pickByLocale`（お知らせ等の DB コンテンツの variant 選び。英語が無ければ
 * 日本語を返す）とは別物。こちらは「その言語のページを出すか」を厳密に判定し、
 * 日本語へ落とさない。
 *
 * @param params - ルートの params（`{ locale }` を含む Promise）
 * @param path - ロケール非依存のパス。動的ルートは値を埋めた具体的なパス
 * @returns 検証済みのロケール
 */
export async function prepareRouteLocale(
  params: Promise<{ locale: string }>,
  path: string,
): Promise<SupportedLocale> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  if (getPublication(path, locale) === "unpublished") notFound();
  setRequestLocale(locale);
  return locale;
}
