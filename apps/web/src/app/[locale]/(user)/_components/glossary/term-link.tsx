"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import { useTermLinksEnabled } from "@/app/_hooks/use-display-settings-store";

import { glossaryLinkTarget } from "./_lib/glossary-link-target";
import { useTermModal } from "./glossary-term-modal-provider";

interface TermLinkProps {
  /** リンク先の用語スラッグ */
  readonly slug: string;
  /** 用語ページへのパス（ロケール非依存。ページの言語の接頭辞はここで付ける） */
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
 *
 * 設定で用語リンクを切っている読者には表示語だけを地の文として返す。
 * 語を覚えた読者にとって、段落ごとに下線が入るのは読む妨げでしかない。
 *
 * `href` はページの言語の用語ページへ張る（英語の章からは
 * `/en/reference/glossary/<slug>`）。その言語で用語ページを出していなければ
 * 日本語のページへ `hrefLang="ja"` 付きで向ける（`glossaryLinkTarget`）。
 * 本文の語ごとに「日本語のみ」の札を挟むと段落が読めなくなるため、札は付けない
 * （用語ページは章と同じ公開単位で、英語の章が出ている間は英語の用語ページも出ている）。
 */
export function TermLink({ slug, href, children }: TermLinkProps) {
  const modal = useTermModal();
  const enabled = useTermLinksEnabled();
  const target = glossaryLinkTarget(href, useLocale());
  const opensModal = modal?.hasTerm(slug) ?? false;

  if (!enabled) return <>{children}</>;

  return (
    <a
      href={target.href}
      hrefLang={target.crossLocale ? DEFAULT_LOCALE : undefined}
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
