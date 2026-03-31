"use client";

import Image from "next/image";

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={48} height={48} className="size-12" />
        <span className="text-base font-bold">
          <span className="text-primary-700">麻雀</span>
          <span className="text-surface-500">点数計算</span>
        </span>
      </div>
    </header>
  );
}
