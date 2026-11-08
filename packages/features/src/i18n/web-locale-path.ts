/**
 * アプリが開く web の URL のパスを言語に合わせる
 * web言語パス
 *
 * web の公開 URL は「日本語は接頭辞なし・英語は `/en` 接頭辞」。アプリ（iOS）が
 * ブラウザで web のページを開くとき（マイページの「その他」・登録の同意文・
 * 利用停止の案内・お知らせ本文のうちアプリに無い画面へのリンク）は、
 * `${SITE_URL}${webLocalePath(path, locale)}` の形でアプリの言語の URL にする。
 * 英語の端末で利用規約を開いて日本語のページが出るのを防ぐため。
 *
 * web の `localizedHref`（`apps/web/src/i18n/public-path.ts`）と同じ変換だが、
 * それを共有せずにここで持つ理由:
 *
 * - web の変換は web だけが知る表（metadata routes・`public/` の実ファイル・
 *   管理画面の接頭辞）に、リンクの出し分けは web の公開状態の表
 *   （`translated-publications.ts`・`resolvePublishedHref`）に結び付いていて、
 *   features（アプリと共有する純粋なモジュール）に置けない
 * - アプリが開く先は閉じた集合（{@link MOBILE_WEB_PAGES} とお知らせ本文の
 *   サイト内リンク）なので、公開状態は見ない。一覧のページが英語で公開済み
 *   であることは web の `publication-gate.test.ts` が固定する。お知らせ本文の
 *   リンクが未公開の英語のページを指しても、web が 404 + noindex を返すので
 *   害は小さい
 *
 * `/api/`・`/auth/` は言語に依らない（`app/[locale]` の外にあり、`/en` を
 * 付けると 404 になる）のでそのまま返す。認証コールバックの着地の言語は
 * `?locale=` の query で決まる。
 *
 * このモジュールは純粋。
 */

import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";

/**
 * アプリがブラウザで開く web のページ
 * アプリが開くwebページ
 *
 * マイページの「その他」（利用規約・プライバシーポリシー・お問い合わせ・
 * 運営会社）、登録の同意文（利用規約・プライバシーポリシー）、利用停止の案内
 * （お問い合わせ）。英語の端末では `/en/...` を開くので、web の
 * `publication-gate.test.ts` がこの一覧の各ページは英語で `published-indexable`
 * であることを検査する。ページを足すときはこの一覧に足す。
 */
export const MOBILE_WEB_PAGES = [
  "/terms",
  "/privacy",
  "/contact",
  "/company",
] as const;

/** アプリが開く web のページのパス */
export type MobileWebPage = (typeof MOBILE_WEB_PAGES)[number];

/** 言語に依らないパスの接頭辞（セグメント単位で判定する） */
const NON_LOCALIZED_PREFIXES: readonly string[] = ["/api", "/auth"];

/** `pathname` が `prefix` そのものか、その下（`prefix/...`）か */
function isSameOrUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * 言語に依らないパスを、その言語の web の公開 URL のパスにする
 * web言語パス変換
 *
 * - 日本語は恒等（既存の URL を変えない）
 * - 英語は `/en` を前置する（`/` は `/en`、`/terms` は `/en/terms`）。
 *   `?query` と `#hash` はそのまま後ろに残す
 * - `/api/`・`/auth/` の下は言語に依らないのでそのまま返す
 * - `/` で始まらない値・`//host`・既に言語の接頭辞が付いた値はそのまま返す
 *   （呼び出し側の誤りを二重の接頭辞にしない）
 *
 * @param path - 言語に依らないパス（query・hash を含んでよい）
 * @param locale - アプリの言語
 */
export function webLocalePath(path: string, locale: SupportedLocale): string {
  if (locale === DEFAULT_LOCALE) return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const suffixStart = path.search(/[?#]/);
  const pathname = suffixStart === -1 ? path : path.slice(0, suffixStart);
  const suffix = suffixStart === -1 ? "" : path.slice(suffixStart);
  if (NON_LOCALIZED_PREFIXES.some((prefix) => isSameOrUnder(pathname, prefix)))
    return path;
  if (isSameOrUnder(pathname, `/${locale}`)) return path;
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return `${prefixed}${suffix}`;
}
