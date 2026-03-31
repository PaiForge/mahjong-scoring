"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeIcon } from "./icons/home-icon";
import { BookIcon } from "./icons/book-icon";
import { TableIcon } from "./icons/table-icon";
import { ChartIcon } from "./icons/chart-icon";

interface NavItemDef {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const navItemDefs: readonly NavItemDef[] = [
  { href: "/", labelKey: "home", icon: <HomeIcon /> },
  { href: "/practice", labelKey: "practice", icon: <BookIcon /> },
  { href: "/reference", labelKey: "reference", icon: <TableIcon /> },
  { href: "/leaderboard", labelKey: "leaderboard", icon: <ChartIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-surface-200 bg-white/90 backdrop-blur-xl z-50">
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <Image src="/logo.png" alt="" width={56} height={56} className="size-14" />
        <span className="text-lg font-bold">
          <span className="text-primary-700">{t("brandMahjong")}</span>
          <span className="text-surface-500">{t("brandScoring")}</span>
        </span>
      </Link>

      <div className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItemDefs.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 h-6 w-1 rounded-r-full bg-primary-500" />
                  )}
                  <span className={isActive ? "text-primary-600" : ""}>{item.icon}</span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
