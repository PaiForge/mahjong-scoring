import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { webLocalePath } from "@mahjong-scoring/features/i18n/web-locale-path";
import {
  ANNOUNCEMENTS_PATH,
  DOJO_PATH,
  LESSONS_PATH,
  MYPAGE_PLAN_PATH,
  PRACTICE_PATH,
  REFERENCE_PATH,
  REFERENCE_YAKU_PATH,
} from "@mahjong-scoring/features/routes";

/**
 * アプリの中に同じ画面があるパスの先頭
 *
 * お知らせの本文のリンクは web の記事として書かれる（`/lessons` のような
 * サイト内のパス）。アプリにも同じパスの画面があるものはアプリの中で開き、
 * 無いもの（ランキング・規約等）は web のページをブラウザで開く。
 * リファレンスは web だけのページ（`/reference/demo` 等）があるので、
 * アプリにある画面だけを並べる。
 */
const APP_PATH_PREFIXES = [
  ANNOUNCEMENTS_PATH,
  DOJO_PATH,
  "/exam",
  LESSONS_PATH,
  PRACTICE_PATH,
  REFERENCE_YAKU_PATH,
  GLOSSARY_PATH,
] as const;

/**
 * web とアプリで置き場所の違う画面（web のパス → アプリのパス）
 *
 * 点数表はアプリではタブにある。早見表の一覧（`/reference`）は持たず、
 * 点数表の下の行が役一覧・用語集の入口になるので、一覧も点数表へ送る。
 * ホームは web のログイン済みのトップ（`/dashboard`。URL は `/` のまま
 * 見える）と同じ画面。`/dojo/ranks` は
 * web が道場へ 301 で送る旧一覧。
 */
const APP_PATH_ALIASES: ReadonlyMap<string, string> = new Map([
  ["/", "/"],
  ["/dashboard", "/"],
  [REFERENCE_PATH, "/score-table"],
  ["/reference/score-table", "/score-table"],
  ["/dojo/ranks", DOJO_PATH],
]);

/**
 * アプリの中ではリンクにしないパスの先頭
 *
 * web の価格・購入（Stripe）・特商法の表記は、アプリの中から辿らせない
 * （App Store の審査ガイドライン 3.1.1。`apps/mobile/CLAUDE.md`）。
 * 本文の文字はそのまま出し、押せなくするだけにする。
 */
const UNLINKED_PATH_PREFIXES = [
  "/plan",
  "/tokushoho",
  MYPAGE_PLAN_PATH,
] as const;

/** パスが先頭のどれかに当たるか（同じ語で始まる別のパスは当てない） */
function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** 本文のリンクの開き方 */
export type AnnouncementLinkTarget =
  | { readonly kind: "app"; readonly path: string }
  | { readonly kind: "browser"; readonly url: string }
  /** リンクにしない（文字だけ出す） */
  | { readonly kind: "text" };

/**
 * お知らせの本文のリンクの開き先を決める
 * お知らせリンク解決
 *
 * サイト内のパス（`/` 始まり）はアプリに同じ画面があればアプリで、無ければ
 * web のページをブラウザで開く。価格・特商法のページはリンクにしない。それ以外（`https://` 等）はブラウザに渡す。
 * サイト自身の URL（`https://<サイト>/lessons`）もパスと同じに扱う。
 *
 * 言語はブラウザで開く web のページにだけ効く（`webLocalePath`。英語は
 * `/en/...`）。英語の端末の記事は英語の一覧・詳細からしか出ないので、
 * そこから開く web のページも英語にする（英語で未公開のページなら web が
 * 404 + noindex を返す。公開状態は web が持ち、アプリは見ない）。アプリの
 * 中で開くパスは言語を持たない（画面の言語は端末の言語で決まる）ので
 * そのまま。リンクにしない規則（価格・特商法）も言語に依らない。外のサイトの
 * URL は変えない。
 *
 * @param href - 本文のリンク先
 * @param siteUrl - web のサイトの URL（末尾の `/` なし）
 * @param locale - アプリの言語（`useAppLocale()`）
 */
export function resolveAnnouncementLink(
  href: string,
  siteUrl: string,
  locale: SupportedLocale,
): AnnouncementLinkTarget {
  const sitePath = href.startsWith(`${siteUrl}/`)
    ? href.slice(siteUrl.length)
    : href;
  if (!sitePath.startsWith("/") || sitePath.startsWith("//")) {
    return { kind: "browser", url: href };
  }
  // web の言語付き URL も、アプリの遷移・購入リンクの除外は同じ規則で判定する。
  // /english のような別のセグメントは取り除かない。query と hash は保つ。
  const path = sitePath.replace(/^\/(?:en|ja)(?=\/|[?#]|$)/, "") || "/";
  const normalizedPath = /^[?#]/.test(path) ? `/${path}` : path;
  const [pathname = normalizedPath] = normalizedPath.split(/[?#]/, 1);
  const suffix = normalizedPath.slice(pathname.length);
  if (matchesPrefix(pathname, UNLINKED_PATH_PREFIXES)) return { kind: "text" };
  const alias = APP_PATH_ALIASES.get(pathname);
  if (alias !== undefined) return { kind: "app", path: `${alias}${suffix}` };
  return matchesPrefix(pathname, APP_PATH_PREFIXES)
    ? { kind: "app", path: normalizedPath }
    : {
        kind: "browser",
        url: `${siteUrl}${webLocalePath(normalizedPath, locale)}`,
      };
}
