import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";
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
 * @param href - 本文のリンク先
 * @param siteUrl - web のサイトの URL（末尾の `/` なし）
 */
export function resolveAnnouncementLink(
  href: string,
  siteUrl: string,
): AnnouncementLinkTarget {
  const path = href.startsWith(`${siteUrl}/`)
    ? href.slice(siteUrl.length)
    : href;
  if (!path.startsWith("/") || path.startsWith("//")) {
    return { kind: "browser", url: href };
  }
  const [pathname = path] = path.split(/[?#]/, 1);
  const suffix = path.slice(pathname.length);
  if (matchesPrefix(pathname, UNLINKED_PATH_PREFIXES)) return { kind: "text" };
  const alias = APP_PATH_ALIASES.get(pathname);
  if (alias !== undefined) return { kind: "app", path: `${alias}${suffix}` };
  return matchesPrefix(pathname, APP_PATH_PREFIXES)
    ? { kind: "app", path }
    : { kind: "browser", url: `${siteUrl}${path}` };
}
