"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { InfoModal } from "@/app/(user)/_components/info-modal";
import { TileSet } from "@/app/(user)/_components/tile-set";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { GlossaryTermPreview } from "@/lib/glossary/queries";

interface TermModalContextValue {
  /** slug の用語を開く。未知の slug なら何もしない */
  readonly openTerm: (slug: string) => void;
  /** slug のプレビューを持っているか（TermLink がモーダルを開くかの判断に使う） */
  readonly hasTerm: (slug: string) => boolean;
}

const TermModalContext = createContext<TermModalContextValue | undefined>(
  undefined,
);

/**
 * 最寄りの用語モーダルの操作口を返す。
 * 用語モーダル参照
 *
 * プロバイダの外で {@link TermLink} を使った場合は undefined を返し、
 * リンクは素の遷移に落ちる。
 */
export function useTermModal(): TermModalContextValue | undefined {
  return useContext(TermModalContext);
}

interface GlossaryTermModalProviderProps {
  /** 配下がリンクしている用語のプレビュー（slug をキーにする） */
  readonly terms: Readonly<Record<string, GlossaryTermPreview>>;
  readonly viewDetailsLabel: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
}

/** 7 枚以上並べる例は 1 段小さい牌にする（モーダルの幅に収めるため） */
const MANY_TILES_THRESHOLD = 7;

/**
 * 配下の用語リンクが共有する 1 枚のモーダル
 * 用語モーダル
 *
 * リンクごとにモーダルを持たず、リンクは `openTerm(slug)` を投げるだけに
 * する。表示するデータは SSR の HTML に埋まっているため、開くのに
 * クライアントからの往復が要らない。
 */
export function GlossaryTermModalProvider({
  terms,
  viewDetailsLabel,
  closeLabel,
  children,
}: GlossaryTermModalProviderProps) {
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);

  const value = useMemo<TermModalContextValue>(
    () => ({
      openTerm: (slug) => {
        if (terms[slug]) setActiveSlug(slug);
      },
      hasTerm: (slug) => Boolean(terms[slug]),
    }),
    [terms],
  );

  const active = activeSlug === undefined ? undefined : terms[activeSlug];

  return (
    <TermModalContext.Provider value={value}>
      {children}
      <InfoModal
        isOpen={active !== undefined}
        onClose={() => setActiveSlug(undefined)}
        title={active?.term ?? ""}
        closeLabel={closeLabel}
      >
        {active !== undefined && (
          <div className="space-y-3">
            <p className="text-xs text-surface-400">{active.reading}</p>
            <p>{active.definition}</p>
            {active.example !== undefined && (
              <div className="overflow-x-auto">
                <TileSet
                  tiles={active.example.tiles}
                  faceDownIndexes={active.example.faceDownIndexes}
                  size={
                    active.example.tiles.length >= MANY_TILES_THRESHOLD
                      ? "xs"
                      : "sm"
                  }
                />
              </div>
            )}
            {active.example?.caption !== undefined && (
              <p className="text-xs text-surface-500">
                {active.example.caption}
              </p>
            )}
            <Link href={active.href} className={TEXT_LINK_CLASSES}>
              {viewDetailsLabel}
            </Link>
          </div>
        )}
      </InfoModal>
    </TermModalContext.Provider>
  );
}
