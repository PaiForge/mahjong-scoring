"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeIcon } from "./icons/home-icon";
import { BookIcon } from "./icons/book-icon";
import { TableIcon } from "./icons/table-icon";
import { ChartIcon } from "./icons/chart-icon";

interface TabItemDef {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const tabItemDefs: readonly TabItemDef[] = [
  { href: "/", labelKey: "home", icon: <HomeIcon /> },
  { href: "/practice", labelKey: "practice", icon: <BookIcon /> },
  { href: "/reference", labelKey: "reference", icon: <TableIcon /> },
  { href: "/leaderboard", labelKey: "leaderboard", icon: <ChartIcon /> },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-center justify-around px-2 py-3">
        {tabItemDefs.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 pt-2 pb-4 text-xs transition-colors ${
                  isActive
                    ? "text-primary-600"
                    : "text-surface-400 hover:text-surface-600"
                }`}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
                {isActive && (
                  <div className="absolute bottom-1 size-1 rounded-full bg-primary-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
