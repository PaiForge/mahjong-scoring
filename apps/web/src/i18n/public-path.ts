/**
 * 公開 URL のパスとロケール非依存のパスの相互変換
 * 公開パス変換
 *
 * 公開 URL は「日本語は接頭辞なし・英語は `/en` 接頭辞」（`routing.ts`）。
 * アプリの中では、ルートの判定・公開状態・リンクの組み立てをすべて
 * ロケール非依存のパス（`/practice/jantou-fu`。iOS と共有する
 * `@mahjong-scoring/features/routes` が返す形）で扱い、接頭辞の付け外しを
 * このモジュールに閉じる。
 *
 * 守っている制約:
 *
 * - **日本語は恒等。** `localizedHref(path, "ja")` は入力をそのまま返す。
 *   既存の日本語 URL（被リンク・索引・canonical）を 1 本も変えないため。
 *   `/ja/...` は内部 URL で、公開リンクに出さない
 * - **接頭辞はセグメント単位で判定する。** `/en` と `/en/...` だけが英語で、
 *   `/english` や `/enx` は日本語のパス。前方一致の文字列比較にすると
 *   `/english` を英語の `/glish` と誤認する
 * - **パスと query / hash を分けて扱う。** 接頭辞はパスにだけ付け、
 *   `?variant=` や `#anchor` はそのまま残す。canonical や公開状態の判定は
 *   パスだけを使う（query を canonical に混ぜない）
 * - **ロケール化しない URL がある。** API・認証コールバック・管理画面・
 *   metadata routes（robots / sitemap / アイコン）・`public/` の実ファイル・
 *   外部 URL・`#anchor`・相対パスには `/en` を付けない。これらは
 *   `app/[locale]` の外にあり、付けると 404 になる
 */

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/** href をパスと、その後ろ（`?query` と `#hash`）に分けたもの */
export interface SplitHref {
  /** `?` と `#` より前の部分 */
  readonly pathname: string;
  /** `?` から始まる query（無ければ空文字） */
  readonly search: string;
  /** `#` から始まる hash（無ければ空文字） */
  readonly hash: string;
}

/**
 * href をパス・query・hash に分ける
 * href分割
 *
 * `#` が `?` より前にあれば、それ以降はすべて hash（URL の構文どおり）。
 *
 * @param href - 分ける href（`/a?b=1#c` 等）
 */
export function splitHref(href: string): SplitHref {
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const searchIndex = beforeHash.indexOf("?");
  return {
    pathname:
      searchIndex === -1 ? beforeHash : beforeHash.slice(0, searchIndex),
    search: searchIndex === -1 ? "" : beforeHash.slice(searchIndex),
    hash,
  };
}

/** 外部 URL のパスを、ロケールとロケール非依存のパスに分けたもの */
export interface ExternalPath {
  /** URL が表す言語。接頭辞が無ければ既定（日本語） */
  readonly locale: SupportedLocale;
  /** ロケール非依存のパス（`/en` は `/`、`/en/practice` は `/practice`） */
  readonly path: string;
  /**
   * URL に付いていたロケール接頭辞（`/en`・`/ja`・大文字混じりの `/EN` 等）。
   * 接頭辞が無ければ undefined
   */
  readonly prefix: string | undefined;
  /**
   * 公開 URL の正規形か。日本語は接頭辞なし、英語は小文字の `/en` が正規。
   * `/ja/...` や `/EN/...` は正規形ではなく、next-intl が正規形へリダイレクトする
   */
  readonly canonical: boolean;
}

/**
 * 外部 URL のパス（アドレスバーの形）をロケールとロケール非依存のパスに分ける
 * 外部パス解析
 *
 * 接頭辞の大文字小文字は区別しない（next-intl の middleware が `/EN/...` を
 * `/en/...` の言い換えとして扱い正規形へリダイレクトするのに合わせる）。
 * 公開判定がこちらと next-intl で食い違わないようにするため。
 * `Accept-Language` や cookie は見ない（言語は URL だけで決める）。
 *
 * @param pathname - リクエストのパス（query・hash を含まない）
 */
export function parseExternalPath(pathname: string): ExternalPath {
  const [, firstSegment = "", ...rest] = pathname.split("/");
  const locale = SUPPORTED_LOCALES.find(
    (candidate) => candidate === firstSegment.toLowerCase(),
  );
  if (locale === undefined) {
    return {
      locale: DEFAULT_LOCALE,
      path: pathname,
      prefix: undefined,
      canonical: true,
    };
  }
  const restPath = rest.join("/");
  return {
    locale,
    path: restPath === "" ? "/" : `/${restPath}`,
    prefix: `/${firstSegment}`,
    canonical: locale !== DEFAULT_LOCALE && firstSegment === locale,
  };
}

/**
 * 外部 URL のパスからロケール接頭辞を外す
 * ロケール除去
 *
 * 既存のルート判定（`isSessionRoute` 等、ロケール非依存のパスを前提に
 * 書かれた関数）へ `usePathname()` の値を渡す前に通す。
 *
 * @param pathname - 外部 URL のパス（`/en/practice/jantou-fu/play` 等）
 * @returns ロケール非依存のパス（`/practice/jantou-fu/play`）
 */
export function stripLocalePrefix(pathname: string): string {
  return parseExternalPath(pathname).path;
}

/** metadata routes（`app/` 直下のファイル規約で配るもの）のパス */
const METADATA_ROUTE_PATHS: ReadonlySet<string> = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
]);

/**
 * `public/` 直下のうち、proxy の matcher の拡張子除外（画像）に掛からない
 * 実ファイル・ディレクトリ
 *
 * `public/` に画像以外のファイルを足したらここにも足す
 * （`public-path.test.ts` が `public/` を走査して漏れを落とす）。
 * 「ドットを含むパスはすべて除外」のような雑な規則にしないのは、
 * ユーザー名などを含む既存の URL を誤って i18n の外へ出さないため。
 */
const PUBLIC_ASSET_PATHS: ReadonlySet<string> = new Set([
  // Google Search Console の所有権確認ファイル
  "/google9cbea86c89b56a83.html",
]);

/** `public/` 配下のディレクトリ（中身ごと i18n の外） */
const PUBLIC_ASSET_DIRECTORIES = ["/tiles"] as const;

/**
 * ロケール化しない（`app/[locale]` の外にある）パスのセグメント接頭辞
 *
 * `/api` は Route Handler、`/auth/callback` は認証コールバック、`/admin` は
 * 管理画面（日本語専用）。`/_next`・`/__nextjs`・`/_vercel` は
 * フレームワークの内部 URL。
 */
const NON_LOCALIZED_PREFIXES = [
  "/api",
  "/auth/callback",
  "/admin",
  "/_next",
  "/__nextjs",
  "/_vercel",
  ...PUBLIC_ASSET_DIRECTORIES,
] as const;

/** `path` が `prefix` 自身か、その配下か（セグメント単位） */
function isSameOrUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * i18n（ロケールの判定・接頭辞・rewrite）の対象外のパスか
 * ロケール対象外判定
 *
 * 対象外のパスには `/en` を付けず、proxy は next-intl に渡さない。
 * 判定はロケール非依存のパス（＝外部 URL のパスそのもの）に対して行う。
 * `/en/api/...` のような「対象外のパスに英語接頭辞を付けたもの」は
 * 対象外ではなく、英語の未公開パスとして 404 にする（proxy）。
 *
 * @param pathname - パス（query・hash を含まない）
 */
export function isNonLocalizedPath(pathname: string): boolean {
  if (METADATA_ROUTE_PATHS.has(pathname)) return true;
  if (PUBLIC_ASSET_PATHS.has(pathname)) return true;
  return NON_LOCALIZED_PREFIXES.some((prefix) =>
    isSameOrUnder(pathname, prefix),
  );
}

/**
 * ロケール非依存の href を、その言語の公開 URL の href にする
 * ロケール付きhref
 *
 * - 日本語は入力をそのまま返す（恒等）。`/ja` は付けない
 * - 英語は `/en` を前に付ける（`/` は `/en`、`/practice?x=1#y` は
 *   `/en/practice?x=1#y`）。query と hash はそのまま
 * - `/` で始まらない href（外部 URL・`mailto:`・`#anchor`・相対パス）、
 *   `//host` で始まる href、ロケール化しないパス（{@link isNonLocalizedPath}）は
 *   そのまま返す
 * - 既に英語の接頭辞が付いた href は二重に付けない
 *
 * 公開状態は見ない（純粋な変換）。未公開ページへのリンクを作らないための
 * 検査は `navigation.ts` の `resolvePublishedHref` が行う。
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param locale - リンク先の言語
 */
export function localizedHref(path: string, locale: SupportedLocale): string {
  if (locale === DEFAULT_LOCALE) return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const { pathname, search, hash } = splitHref(path);
  if (isNonLocalizedPath(pathname)) return path;
  if (parseExternalPath(pathname).prefix !== undefined) return path;
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return `${prefixed}${search}${hash}`;
}

/**
 * ロケール非依存のパスを、内部のルート（`app/[locale]/...`）のパスにする
 * 内部ロケールパス
 *
 * `revalidatePath` に渡すためのもの。公開 URL（{@link localizedHref}）と違い、
 * 既定の言語にも接頭辞を付ける（`/lessons` は `/ja/lessons`・`/en/lessons`、
 * `/` は `/ja`・`/en`）。日本語の公開 URL は proxy が内部の `/ja/...` へ
 * rewrite して描くので、キャッシュの実体は内部のパスにある。
 * query・hash はそのまま残す。`/` で始まらない値・既に接頭辞の付いた値・
 * ロケール化しないパスは扱わない（呼び出し側の誤り）ので、そのまま返す。
 *
 * @param path - ロケール非依存のパス（`/lessons/jantou-fu` 等）
 * @param locale - 内部ルートの言語
 */
export function internalLocalePath(
  path: string,
  locale: SupportedLocale,
): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const { pathname, search, hash } = splitHref(path);
  if (isNonLocalizedPath(pathname)) return path;
  if (parseExternalPath(pathname).prefix !== undefined) return path;
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return `${prefixed}${search}${hash}`;
}
