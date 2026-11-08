import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { localizedHref, splitHref } from "@/i18n/public-path";
import { getTranslatedPublication } from "@/i18n/translated-publications";
import { buildSignInHref } from "@/lib/redirect";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * クライアントの練習の部品が張るリンクの先を、今のページの言語に合わせる
 * 練習のリンク先解決（クライアント）
 *
 * サーバーの `resolveNavTargetFor`（`locale-nav-target.ts`）と同じ規則を、
 * クライアントから読める軽い公開状態の表（`translated-publications.ts`）で引く版。
 * 練習の盤面（クライアント）の奥にある部品（無料枠のペイウォール・残り回数・
 * 手牌の設定へのリンク）は、サーバーの親から `NavTarget` を props で受け取るには
 * 盤面を何段も貫く必要があるため、こちらで自分で解く。`route-policy.ts` は
 * sitemap のレジストリを読み込むのでクライアントから import しない
 * （パンくずと `[locale]/(user)/error.tsx` が同じ表を使う前例）。
 *
 * - 既定の言語（日本語）では入力をそのまま返す（日本語のリンクを 1 本も動かさない）
 * - その言語で公開しているページならその言語の href（query・hash は残す）
 * - 未公開なら日本語の href のまま `crossLocale: true`。描く側は `LocaleNavLink`
 *   （素の `<a hrefLang="ja">`）と `JapaneseOnlyMark` で「日本語のみ」と明示する
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param locale - リンクを置くページの言語
 */
export function clientNavTarget(
  path: string,
  locale: SupportedLocale,
): NavTarget {
  if (locale === DEFAULT_LOCALE) return { href: path, crossLocale: false };
  if (
    getTranslatedPublication(splitHref(path).pathname, locale) === "unpublished"
  )
    return { href: path, crossLocale: true };
  return { href: localizedHref(path, locale), crossLocale: false };
}

/**
 * ログインへの導線の先
 * ログイン導線解決
 *
 * 日本語では渡された `japanesePath`（今までの href）をそのまま使う。
 * それ以外の言語では、ログインのあとに今のページへ戻れるよう `?redirect=` に
 * `returnTo`（今のページの公開 URL。英語なら `/en/...`）を載せる。ログインが
 * その言語で未公開なら日本語のログインへ「日本語のみ」として送る — 登録・ログインは
 * 言語をまたいでも成立し、戻り先が英語のページなら英語へ戻れる。
 *
 * @param locale - リンクを置くページの言語
 * @param returnTo - ログインのあとに戻す公開 URL（`/en/practice` 等）
 * @param japanesePath - 日本語のページで使う href（既定は `/sign-in`）
 */
export function signInNavTarget(
  locale: SupportedLocale,
  returnTo: string,
  japanesePath = "/sign-in",
): NavTarget {
  if (locale === DEFAULT_LOCALE)
    return { href: japanesePath, crossLocale: false };
  return clientNavTarget(buildSignInHref(returnTo), locale);
}
