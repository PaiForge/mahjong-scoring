"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "./brand-logo";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-surface-200 bg-surface-50 px-6 py-10 pb-24 md:pb-10 md:ml-64">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">{t("learn")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/learn/introduction" className="text-surface-600 hover:text-primary-600 transition-colors">
                  {t("introduction")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">{t("other")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-surface-600 hover:text-primary-600 transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-surface-600 hover:text-primary-600 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
          <p className="text-xs text-surface-400">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
