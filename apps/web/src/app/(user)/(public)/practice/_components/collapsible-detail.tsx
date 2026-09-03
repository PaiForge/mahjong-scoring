"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

interface CollapsibleDetailProps {
  /** 見出し。そのまま開閉ボタンのラベルになる */
  readonly title: string;
  /** 展開時に表示する本文 */
  readonly children: ReactNode;
}

/**
 * 見出しを押して開く詳細ブロック
 * 開閉式詳細
 *
 * 結果詳細の中に積む内訳表を、既定で閉じた状態にする器。問題別詳細は
 * 「手牌 → 面子の内訳 → 翻数の内訳 → 答え合わせ」と縦に伸びるため、
 * 内訳を常に開いておくと、まず見たい答え合わせが表の下へ押し出される。
 * 数え直したい人だけが開く。
 *
 * 見出しの体裁は {@link DetailTable} の `title` と揃える（閉じている間も
 * 開いた後も、同じ位置に同じ濃さで見出しが出る）。▶ の回転で開閉を示すのは
 * {@link import("@/app/(user)/_components/accordion-card").AccordionCard} と
 * 同じ約束。閉じている間は本文を描画しない。
 *
 * 器なので見出しの文言は持たない。何の内訳かは中身を知る呼び出し側が渡す。
 */
export function CollapsibleDetail({ title, children }: CollapsibleDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-1.5 text-left text-sm font-bold text-surface-900"
      >
        <svg
          className={`size-3 flex-shrink-0 text-surface-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        {title}
      </button>
      {isOpen && <div id={panelId}>{children}</div>}
    </div>
  );
}
