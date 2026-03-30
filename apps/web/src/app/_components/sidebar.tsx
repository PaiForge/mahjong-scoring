"use client";

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
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-500 text-white">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-4.5h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm-2.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-6.75a2.25 2.25 0 00-2.25-2.25H15" />
          </svg>
        </div>
        <span className="text-lg font-bold">
          <span className="text-primary-700">Mahjong</span>
          <span className="text-surface-500">Scoring</span>
        </span>
      </div>

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
