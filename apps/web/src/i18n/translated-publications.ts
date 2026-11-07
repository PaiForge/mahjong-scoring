import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { localizedHref, splitHref } from "./public-path";

/**
 * 既定以外の言語で公開しているページ（許可リスト）
 * 翻訳公開表
 *
 * `route-policy.ts` の英語の分類の正本。日本語の分類（sitemap のレジストリを
 * 読む）と切り離して、クライアントのツリーからも読めるようにしてある。
 *
 * @design クライアントから読める軽い表として分ける
 * パンくず（クライアントのコンポーネントからも描かれる）とエラー境界
 * （`"use client"`）は、英語のページで「この段・このリンク先は英語で出しているか」を
 * 知りたい。`route-policy.ts` を直接 import すると、日本語の分類が読む sitemap の
 * レジストリ（教本・用語・段級位・料金）ごとクライアントの JS に載る（LP が読む
 * チャンクにも入っていた）。クライアントが要るのは既定以外の言語の許可リストだけ
 * なので、それをこのモジュールに置き、`route-policy.ts` もここを読む（判定を
 * 二重に持たない）。このモジュールに重いレジストリの import を足さない
 * （`client-bundle-boundaries.test.ts` がクライアントからの到達を検査する）。
 */

/**
 * ページの公開状態
 *
 * - `unpublished` — その言語では出していない。英語なら proxy が 404 を返す
 * - `published-noindex` — 出しているが索引させない。sitemap・hreflang に載せない
 *   （noindex 指定のページ、robots で除外したページ、認証フロー等を含む）
 * - `published-indexable` — 出して索引させる。canonical・sitemap・hreflang の対象
 */
export type Publication =
  "unpublished" | "published-noindex" | "published-indexable";

/** 既定（日本語）以外の対応言語 */
export type TranslatedLocale = Exclude<SupportedLocale, typeof DEFAULT_LOCALE>;

/**
 * 言語ごとの公開ページ（許可リスト）
 *
 * ここに無いパスはその言語では `unpublished`。英語のページを公開するときは、
 * そのページの英語の本文・metadata が揃っていることを確かめてから足す。
 */
const TRANSLATED_PUBLICATIONS: Readonly<
  Record<TranslatedLocale, ReadonlyMap<string, Publication>>
> = {
  en: new Map([["/reference/score-table", "published-indexable"]]),
};

/**
 * 既定以外の言語での公開状態を返す
 * 翻訳公開状態取得
 *
 * query・hash は落としてから判定する。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 既定以外の言語
 */
export function getTranslatedPublication(
  path: string,
  locale: TranslatedLocale,
): Publication {
  const { pathname } = splitHref(path);
  return TRANSLATED_PUBLICATIONS[locale].get(pathname) ?? "unpublished";
}

/**
 * その言語で公開しているパスの一覧（許可リストなので有限に列挙できる）
 *
 * @param locale - 既定以外の言語
 */
export function translatedPublishedPaths(
  locale: TranslatedLocale,
): readonly string[] {
  return [...TRANSLATED_PUBLICATIONS[locale].keys()];
}

/**
 * その言語のトップへの href（その言語のトップが未公開なら日本語のトップ）
 * 公開トップhref
 *
 * エラー境界・404 の「ホームへ戻る」に使う。404 から 404 へ案内しないため、
 * 未公開の言語のトップ（いまの `/en`）へは向けない。日本語のトップは
 * 常に公開している。
 *
 * @param locale - 今のページの言語
 */
export function publishedHomeHref(locale: SupportedLocale): string {
  if (locale === DEFAULT_LOCALE) return "/";
  return getTranslatedPublication("/", locale) === "unpublished"
    ? "/"
    : localizedHref("/", locale);
}
