"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <Link href="/">
        <BrandLogo size="md" />
      </Link>
    </header>
  );
}
