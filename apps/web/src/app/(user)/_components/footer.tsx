import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "./brand-logo";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { chapterHref } from "@/app/(user)/(public)/learn/_lib/curriculum";

/**
 * フッター。
 * blindfold-chess の Footer を移植。カテゴリ列 + 区切り線 + コピーライト。
 */
export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto border-t-4 border-ink bg-card">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        <nav className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("learn")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={chapterHref("about-this-app")}
                  className={TEXT_LINK_CLASSES}
                >
                  {t("aboutThisApp")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("other")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className={TEXT_LINK_CLASSES}>
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={TEXT_LINK_CLASSES}>
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="border-t-2 border-dashed border-border/40 pt-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <BrandLogo size="sm" />
            </Link>
            <p className="text-xs text-muted-foreground">{t("copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
