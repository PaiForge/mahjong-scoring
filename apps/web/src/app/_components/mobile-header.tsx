"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "./brand-logo";
import { UserIcon } from "./icons/user-icon";
import { useAuth } from "@/app/_contexts/auth-context";

export function MobileHeader() {
  const t = useTranslations("nav");
  const { user, isLoading } = useAuth();

  return (
    <header className="md:hidden flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <Link href="/">
        <BrandLogo size="md" />
      </Link>
      {isLoading ? (
        <div className="flex items-center gap-1.5">
          <div className="size-4 rounded-full bg-surface-200 animate-pulse" />
          <div className="h-3.5 w-10 rounded bg-surface-200 animate-pulse" />
        </div>
      ) : user ? (
        <Link
          href="/mypage"
          className="flex items-center gap-1.5 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
        >
          <UserIcon className="size-4" />
          {t("mypage")}
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className="flex items-center gap-1.5 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
        >
          <UserIcon className="size-4" />
          {t("login")}
        </Link>
      )}
    </header>
  );
}
