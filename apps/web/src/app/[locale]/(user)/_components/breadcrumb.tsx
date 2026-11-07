import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { SITE_URL } from "@/config";
import { localizedHref, splitHref } from "@/i18n/public-path";
import { getTranslatedPublication } from "@/i18n/translated-publications";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { JsonLd } from "./json-ld";

export interface BreadcrumbItem {
  readonly label: string;
  /**
   * リンク先のロケール非依存のパス（`/practice/jantou-fu`）。表示中の言語の
   * パス（英語は `/en/...`）にしてからリンクと JSON-LD に使う。
   * 省略時はリンクなし（現在地）として表示する
   */
  readonly href?: string;
}

interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
}

/** 表示する 1 段（言語のパスを解決済み） */
interface ResolvedCrumb {
  readonly label: string;
  /** リンクする言語のパス。リンクしない段（現在地・その言語で未公開）は undefined */
  readonly href: string | undefined;
  /** JSON-LD に載せるか（その言語で出していない段は載せない） */
  readonly inSchema: boolean;
}

/** BreadcrumbList として意味を持つ最小の段数（ホーム + 現在地） */
const MIN_SCHEMA_ITEMS = 2;

/** next-intl のロケールを、対応ロケールに絞る（想定外の値は日本語） */
function toSupportedLocale(locale: string): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

/**
 * パンくずの 1 段のリンク先を、表示中の言語で解決する
 *
 * 日本語は渡されたパスをそのまま使う（既存の出力のまま）。英語は公開状態
 * （`route-policy.ts`）を見て、英語で出していないページ（404 になる `/en/...`）へは
 * リンクせず JSON-LD にも載せない。日本語のページへ言語をまたいで寄せることも
 * しない（英語の本文のパンくずに日本語のページを混ぜない）。
 */
function resolveCrumb(
  label: string,
  path: string | undefined,
  locale: SupportedLocale,
): ResolvedCrumb {
  if (path === undefined) return { label, href: undefined, inSchema: true };
  // 公開状態は軽い許可リスト（`translated-publications.ts`）から引く。パンくずは
  // クライアントのツリーからも描かれ、`route-policy.ts` を読むと sitemap の
  // レジストリごとクライアントの JS に載るため
  const published =
    locale === DEFAULT_LOCALE ||
    getTranslatedPublication(splitHref(path).pathname, locale) !==
      "unpublished";
  return published
    ? { label, href: localizedHref(path, locale), inSchema: true }
    : { label, href: undefined, inSchema: false };
}

/**
 * 言語のパスを絶対 URL にする
 *
 * 日本語トップは末尾スラッシュ無しの `SITE_URL`（既存の出力のまま）。
 * 英語トップは `${SITE_URL}/en`。
 */
function absoluteUrl(localized: string): string {
  return localized === "/" ? SITE_URL : `${SITE_URL}${localized}`;
}

/**
 * パンくずリスト（blindfold-chess の Breadcrumb 準拠）。
 *
 * 先頭はホーム（チェスではロゴ画像だが、ここでは 🏠 絵文字）。
 * SEO 用に BreadcrumbList の JSON-LD も出力する。
 *
 * 表示している言語に合わせる: ホームの名前（`aria-label` と JSON-LD の `name`）は
 * 辞書の `nav.home`、リンクと JSON-LD の `item` はその言語のページの URL
 * （日本語は接頭辞なし、英語は `/en`）。JSON-LD は見えている本文と同じ言語の
 * 名前・同じ言語のページだけを指す。その言語で出していない段は文字だけを残して
 * リンクせず、JSON-LD から外す（段が 2 つ未満になれば JSON-LD を出さない）。
 *
 * 言語は next-intl のリクエストのロケール（`[locale]` のページが
 * `setRequestLocale` で確定したもの）から読み、呼び出し側から props で渡さない —
 * パンくずはサーバーとクライアントのどちらのツリーからも描かれ、呼び出し側ごとに
 * 言語を配線すると取り違えるため。`useTranslations` / `useLocale` はサーバー
 * コンポーネントとクライアントコンポーネントの両方で動く（クライアントでは
 * `nav` を `client-messages.ts` が渡す）。
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const t = useTranslations("nav");
  const locale = toSupportedLocale(useLocale());
  const home = resolveCrumb(t("home"), "/", locale);
  const crumbs = items.map((item) =>
    resolveCrumb(item.label, item.href, locale),
  );

  const schemaCrumbs = [home, ...crumbs].filter((crumb) => crumb.inSchema);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schemaCrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href === undefined ? undefined : absoluteUrl(crumb.href),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="flex min-h-6 items-center">
      {schemaCrumbs.length >= MIN_SCHEMA_ITEMS && <JsonLd data={schema} />}
      <ol className="flex flex-wrap items-center gap-x-1 text-sm">
        <li>
          {home.href === undefined ? (
            <span role="img" aria-label={home.label}>
              🏠
            </span>
          ) : (
            <Link
              href={home.href}
              aria-label={home.label}
              className="transition-opacity hover:opacity-70"
            >
              🏠
            </Link>
          )}
        </li>
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            <span className="mx-1 text-muted-foreground">/</span>
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : items[index]?.href === undefined ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              // その言語で出していない祖先の段。現在地の強調はせず、文字だけ残す
              <span className="text-muted-foreground">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
