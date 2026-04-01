"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "./brand-logo";
import { UserIcon } from "./icons/user-icon";
import { NAV_ITEMS } from "./_lib/nav-items";
import { useAuth } from "@/app/_contexts/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { user, isLoading } = useAuth();

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-surface-200 bg-white/90 backdrop-blur-xl z-50">
      <Link href="/" className="px-6 py-5">
        <BrandLogo size="lg" />
      </Link>

      <div className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
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

      <div className="border-t border-surface-200 px-3 py-4">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-5 rounded-full bg-surface-200 animate-pulse" />
            <div className="h-4 w-16 rounded bg-surface-200 animate-pulse" />
          </div>
        ) : user ? (
          <Link
            href="/mypage"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
          >
            <UserIcon />
            {t("mypage")}
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
          >
            <UserIcon />
            {t("login")}
          </Link>
        )}
      </div>
    </nav>
  );
}
