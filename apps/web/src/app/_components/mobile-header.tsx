"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function MobileHeader() {
  const t = useTranslations("nav");

  return (
    <header className="md:hidden flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={48} height={48} className="size-12" />
        <span className="text-base font-bold">
          <span className="text-primary-700">{t("brandMahjong")}</span>
          <span className="text-surface-500">{t("brandScoring")}</span>
        </span>
      </Link>
    </header>
  );
}
