import "server-only";

import { currentLocale } from "@/i18n/current-locale";
import { resolvePublishedHref } from "@/i18n/navigation";
import { EN_PUBLISHED_PATHS } from "@/i18n/route-policy";
import { SUPPORTED_LOCALES } from "@mahjong-scoring/features/i18n/locales";

import type { LocaleLinkTable, LocaleLinks } from "./locale-links";

/**
 * 英語で公開しているパスごとの、言語ごとの公開 href
 * 公開hrefの表
 *
 * 公開状態の判定は `resolvePublishedHref`（`route-policy.ts`）にだけ任せ、
 * ここはその結果を表に詰めるだけ。英語は許可リストなので有限に列挙できる。
 * 表に無いパスは英語では未公開（日本語のページだけがある）として扱われる。
 *
 * サーバー専用（`server-only`）。`route-policy.ts` は sitemap のルートの
 * レジストリを読み込むため、クライアントの部品へはこの表だけを props で渡す
 * （理由は `locale-links.ts` の TSDoc）。
 */
export const LOCALE_LINK_TABLE: LocaleLinkTable = Object.fromEntries(
  EN_PUBLISHED_PATHS.map((path) => [
    path,
    Object.fromEntries(
      SUPPORTED_LOCALES.flatMap((locale) => {
        const href = resolvePublishedHref(path, locale);
        return href === undefined ? [] : [[locale, href] as const];
      }),
    ),
  ]),
);

/**
 * シェルの部品に渡す「今のページの言語と公開 href の表」を作る
 * ロケールリンク取得
 */
export async function getLocaleLinks(): Promise<LocaleLinks> {
  return { locale: await currentLocale(), table: LOCALE_LINK_TABLE };
}
