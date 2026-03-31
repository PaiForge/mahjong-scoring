"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="border-t border-surface-200 bg-surface-50 px-6 py-10 md:ml-64">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={28} height={28} className="size-7" />
            <span className="text-sm font-bold">
              <span className="text-primary-700">{tNav("brandMahjong")}</span>
              <span className="text-surface-500">{tNav("brandScoring")}</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-surface-400">{t("copyright")}</p>
        </div>

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
    </footer>
  );
}
