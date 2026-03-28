"use client";

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary-500 text-white">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-4.5h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm-2.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-6.75a2.25 2.25 0 00-2.25-2.25H15" />
          </svg>
        </div>
        <span className="text-base font-bold">
          <span className="text-primary-700">Mahjong</span>
          <span className="text-surface-500">Scoring</span>
        </span>
      </div>
    </header>
  );
}
