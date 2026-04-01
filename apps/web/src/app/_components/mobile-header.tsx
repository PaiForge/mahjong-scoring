"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { AuthNavItem } from "./auth-nav-item";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <Link href="/">
        <BrandLogo size="md" />
      </Link>
      <AuthNavItem
        className="flex items-center gap-1.5 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
        iconClassName="size-4"
        skeletonIconClassName="size-4"
        skeletonTextClassName="h-3.5 w-10"
      />
    </header>
  );
}
