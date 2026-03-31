"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "./_lib/nav-items";

export function MobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-center justify-around px-2 py-3">
        {NAV_ITEMS.map((item) => {
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
