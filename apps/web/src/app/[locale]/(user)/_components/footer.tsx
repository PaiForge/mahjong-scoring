import { getTranslations } from "next-intl/server";

import { AppDownloadPanel } from "@/app/[locale]/(user)/_components/app-download/app-download-panel";
import { BrandLogo } from "@/app/_components/brand-logo";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { getLocaleLinks } from "./_lib/locale-link-table";
import { resolveNavTarget, type NavTarget } from "./_lib/locale-links";
import { LanguageSwitcher } from "./language-switcher";
import { JapaneseOnlyMark, LocaleNavLink } from "./locale-nav-link";

/**
 * フッターの「その他」の列のリンク（辞書キー `footer.<labelKey>`）
 *
 * キーは型で辞書と結ばれる（`footer` 名前空間の文言のキー）。
 */
const OTHER_LINKS = [
  { href: "/terms", labelKey: "terms" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/contact", labelKey: "contact" },
  { href: "/tokushoho", labelKey: "tokushoho" },
  { href: "/company", labelKey: "company" },
] as const;

/**
 * フッター。
 * blindfold-chess の Footer を移植。カテゴリ列 + 区切り線 + コピーライト。
 *
 * @design 言語切替を通常のリンクで常設する
 * 「言語」の列に `LanguageSwitcher` を置く。ヘッダーの切替は md 以上だけ、
 * ドロワーの切替はマウント後にしか描かれないので、ここが JavaScript の無い
 * 閲覧者とクローラーにも届く切替になる（初期 HTML に素の `<a href>` で出る）。
 * 自動の転送・言語の提案はしない。
 *
 * 英語のページでは、英語版の無いページへのリンクを `/en` を付けずに日本語の
 * ページへ素のリンクで向け、「日本語のみ」と添える。ロゴは読み上げだけで添える。
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const localeLinks = await getLocaleLinks();
  const japaneseOnly = tNav("language.japaneseOnly");
  const homeTarget = resolveNavTarget("/", localeLinks);

  return (
    <footer className="mt-auto border-t border-panel bg-card">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        <nav className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("introduction")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <FooterLink
                  target={resolveNavTarget(
                    chapterHref("about-this-app"),
                    localeLinks,
                  )}
                  japaneseOnly={japaneseOnly}
                >
                  {t("aboutThisApp")}
                </FooterLink>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("other")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {OTHER_LINKS.map(({ href, labelKey }) => (
                <li key={href}>
                  <FooterLink
                    target={resolveNavTarget(href, localeLinks)}
                    japaneseOnly={japaneseOnly}
                  >
                    {t(labelKey)}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {tNav("language.label")}
            </h3>
            <LanguageSwitcher localeLinks={localeLinks} variant="stacked" />
          </div>

          {/* 狭い画面では 2 列目に収めず 1 行を使う（バッジの横幅） */}
          <div className="col-span-2 space-y-3 md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t("app")}
            </h3>
            <AppDownloadPanel
              locale={localeLinks.locale}
              size="sm"
              align="start"
            />
          </div>
        </nav>

        <div className="border-t border-panel pt-6">
          <div className="flex items-center justify-between">
            <LocaleNavLink navTarget={homeTarget} linkKind="plain">
              <BrandLogo size="sm" />
              {homeTarget.crossLocale && (
                <JapaneseOnlyMark label={japaneseOnly} visuallyHidden />
              )}
            </LocaleNavLink>
            <p className="text-xs text-muted-foreground">{t("copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** フッターのテキストリンク 1 つ（言語をまたぐなら「日本語のみ」と添える） */
function FooterLink({
  target,
  japaneseOnly,
  children,
}: {
  readonly target: NavTarget;
  readonly japaneseOnly: string;
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <LocaleNavLink
        navTarget={target}
        linkKind="plain"
        className={TEXT_LINK_CLASSES}
      >
        {children}
      </LocaleNavLink>
      {target.crossLocale && <JapaneseOnlyMark label={japaneseOnly} />}
    </>
  );
}
