/**
 * アプリの中に同じ画面があるパスの先頭
 *
 * お知らせの本文のリンクは web の記事として書かれる（`/lessons` のような
 * サイト内のパス）。アプリにも同じパスの画面があるものはアプリの中で開き、
 * 無いもの（ランキング・料金・規約等）は web のページをブラウザで開く。
 */
const APP_PATH_PREFIXES = [
  "/announcements",
  "/dojo",
  "/exam",
  "/lessons",
  "/practice",
  "/reference",
] as const;

/** 本文のリンクの開き方 */
export type AnnouncementLinkTarget =
  | { readonly kind: "app"; readonly path: string }
  | { readonly kind: "browser"; readonly url: string };

/**
 * お知らせの本文のリンクの開き先を決める
 * お知らせリンク解決
 *
 * サイト内のパス（`/` 始まり）はアプリに同じ画面があればアプリで、無ければ
 * web のページをブラウザで開く。それ以外（`https://` 等）はブラウザに渡す。
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
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  const inApp = APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return inApp
    ? { kind: "app", path }
    : { kind: "browser", url: `${siteUrl}${path}` };
}
