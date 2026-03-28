"use client";

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-xs">
          麻
        </div>
        <span className="text-base font-bold">
          <span className="text-primary-700">Mahjong</span>
          <span className="text-surface-500">Scoring</span>
        </span>
      </div>
    </header>
  );
}
