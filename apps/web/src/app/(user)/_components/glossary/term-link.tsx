"use client";

import type { ReactNode } from "react";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import { useTermModal } from "./glossary-term-modal-provider";

interface TermLinkProps {
  /** リンク先の用語スラッグ */
  readonly slug: string;
  /** 用語ページへのパス */
  readonly href: string;
  /** 本文に現れている表示語 */
  readonly children: ReactNode;
}

/**
 * 本文中の用語リンク
 * 用語リンク
 *
 * 常に本物の `<a href>` を描く。クローラからは用語ページへの内部リンクに
 * 見え、JavaScript が無くても遷移できる。その上で、プレビューを持つ
 * プロバイダが上にいるときだけ、左クリックを奪って意味のモーダルを開く
 * — 読んでいる途中で語の意味を確かめる読者を、ページ遷移で章から
 * 引き剥がさないため。
 *
 * 修飾キー付きのクリックや中クリックは奪わない（新しいタブで開く操作を
 * 壊さない）。
 */
export function TermLink({ slug, href, children }: TermLinkProps) {
  const modal = useTermModal();
  const opensModal = modal?.hasTerm(slug) ?? false;

  return (
    <a
      href={href}
      className={TEXT_LINK_CLASSES}
      onClick={(event) => {
        if (!opensModal) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        if (event.button !== 0) return;
        event.preventDefault();
        modal?.openTerm(slug);
      }}
    >
      {children}
    </a>
  );
}
