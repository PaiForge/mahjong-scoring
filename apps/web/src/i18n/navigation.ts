import type { ComponentProps, ForwardRefExoticComponent } from "react";

import { createNavigation } from "next-intl/navigation";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { localizedHref, splitHref } from "./public-path";
import { getPublication } from "./route-policy";
import { routing } from "./routing";

/**
 * ロケールを意識したナビゲーションの薄い層
 * ロケールナビゲーション
 *
 * next-intl の `createNavigation` を `routing.ts` の設定で束ねたもの。
 * 今のロケールのまま遷移する `Link` / `redirect` / `useRouter` と、
 * ロケール接頭辞を外したパスを返す `usePathname` を出す。
 *
 * **言語をまたぐリンク（言語切替）に next-intl の `locale` 指定を使わない。**
 * next-intl の `Link` は `locale` を渡されると、既定言語でも接頭辞を強制する
 * （`<Link locale="ja">` が `/ja/...` を出す）。`/ja/...` は内部 URL で、
 * 公開リンクに出すと正規化のリダイレクトを 1 回余計に挟み、内部 URL が
 * 索引される恐れもある。そのためここの `Link` は `locale` を受け取らない型にし、
 * 言語切替は {@link resolvePublishedHref} の結果（日本語は接頭辞なしの最終 URL）を
 * 普通のリンクに渡す。
 */
const navigation = createNavigation(routing);

/**
 * 今のロケールのまま遷移するリンク（`locale` は受け取らない。言語切替は
 * {@link resolvePublishedHref} を使う）
 */
export const Link: ForwardRefExoticComponent<
  Omit<ComponentProps<typeof navigation.Link>, "locale">
> = navigation.Link;

export const { redirect, usePathname, useRouter, getPathname } = navigation;

/**
 * ある言語で公開しているページなら、その言語の公開 URL の href を返す
 * 公開済みhref解決
 *
 * 言語切替・言語をまたぐ内部リンクは必ずここを通す。未公開
 * （`unpublished`）なら undefined を返すので、呼び出し側はリンクを出さない。
 * 404 になる英語 URL へ内部リンクを張らないため。日本語は接頭辞なしの
 * 最終 URL（`/ja` を経由しない）。query・hash は残す。
 *
 * 公開状態は `published-noindex` でも「出している」扱い（リンクは張ってよい）。
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param locale - リンク先の言語
 */
export function resolvePublishedHref(
  path: string,
  locale: SupportedLocale,
): string | undefined {
  const { pathname } = splitHref(path);
  if (getPublication(pathname, locale) === "unpublished") return undefined;
  return localizedHref(path, locale);
}
