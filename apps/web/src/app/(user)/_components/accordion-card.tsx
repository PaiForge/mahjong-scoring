"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

interface AccordionCardProps {
  /** ヘッダー左側（▶ の右）に表示する見出し */
  readonly title: ReactNode;
  /** ヘッダー右端に表示する補足（正誤バッジ・翻数など。任意） */
  readonly trailing?: ReactNode;
  /** 展開時に表示する本文 */
  readonly children: ReactNode;
}

/**
 * 開閉式カード
 * アコーディオンカード
 *
 * 太枠カードのヘッダーを押すと本文を展開する。▶ の回転・破線区切り・本文の
 * 薄い背景など「開閉するもの」の見た目をここに集約し、練習結果の問題一覧と
 * 役一覧の例示手牌で同じ操作感にする。本文は閉じている間は描画しない。
 */
export function AccordionCard({
  title,
  trailing,
  children,
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-lg border-3 border-ink bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-surface-50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <svg
            className={`size-3 flex-shrink-0 text-surface-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          {title}
        </div>
        {trailing !== undefined && (
          <div className="ml-2 flex flex-shrink-0 items-center gap-1">
            {trailing}
          </div>
        )}
      </button>
      {isOpen && (
        <div
          id={panelId}
          className="border-t-2 border-dashed border-border/40 bg-surface-50 px-3 pb-3 pt-3"
        >
          {children}
        </div>
      )}
    </div>
  );
}
