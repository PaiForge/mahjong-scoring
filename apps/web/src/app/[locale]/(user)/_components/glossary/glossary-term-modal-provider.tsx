"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { InfoModal } from "@/app/[locale]/(user)/_components/info-modal";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { MentsuSet } from "@/app/[locale]/(user)/_components/mentsu-set";
import { TileSet } from "@/app/[locale]/(user)/_components/tile-set";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { GlossaryTermPreview } from "@mahjong-scoring/features/glossary/views";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@mahjong-scoring/features/settings/preference-anchors";

import { glossaryLinkTarget } from "./_lib/glossary-link-target";

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
  /** 用語リンクを切る設定への導線の文言 */
  readonly turnOffLabel: string;
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
 *
 * 用語リンクを切る設定への導線もここに置く。リンクが邪魔だと感じるのは
 * たいてい意図せずモーダルが開いた瞬間で、設定ページを自分から見に行く
 * 読者しか辿り着けない状態では、いちばん困っている人に届かないため。
 * その場で切らずに設定ページへ送るのは、設定が会員限定（未ログインでは
 * 操作できない）で、切った後に戻す場所と揃わなくなるから。
 *
 * 2 本のリンク（用語ページ・設定）はページの言語で張る（`glossaryLinkTarget`。
 * 英語の章からは英語の用語ページへ）。英語で出していない設定ページへは、
 * `/en` を付けずに日本語のページへ素の `<a hrefLang="ja">` で向けて
 * 「日本語のみ」と添える。公開状態はクライアントからも読める許可リスト
 * （`translated-publications.ts`）から引くので、サーバー側（`LearnPageLayout`）から
 * 張る先を渡してもらう配線は要らない。
 */
export function GlossaryTermModalProvider({
  terms,
  viewDetailsLabel,
  turnOffLabel,
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
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const settingsTarget = glossaryLinkTarget(
    preferencesHref(PREFERENCE_ANCHORS.termLinks),
    locale,
  );

  return (
    <TermModalContext value={value}>
      {children}
      <InfoModal
        isOpen={active !== undefined}
        onClose={() => setActiveSlug(undefined)}
        title={active?.term ?? ""}
        closeLabel={closeLabel}
        footnote={
          // 主役は語の意味なので、「用語ページを見る」と同じ強さで並べない。
          // 閉じるボタンの下に小さく置き、探している人にだけ見つかる大きさにする
          <>
            <LocaleNavLink
              navTarget={settingsTarget}
              linkKind="plain"
              className={TEXT_LINK_CLASSES}
            >
              {turnOffLabel}
            </LocaleNavLink>
            {settingsTarget.crossLocale && (
              <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
            )}
          </>
        }
      >
        {active !== undefined && (
          <div className="space-y-3">
            <p className="text-xs text-surface-400">{active.reading}</p>
            <p>{active.definition}</p>
            {active.example !== undefined && (
              <div className="overflow-x-auto">
                {"mentsu" in active.example ? (
                  <MentsuSet mentsu={active.example.mentsu} />
                ) : (
                  <TileSet
                    tiles={active.example.tiles}
                    size={
                      active.example.tiles.length >= MANY_TILES_THRESHOLD
                        ? "xs"
                        : "sm"
                    }
                  />
                )}
              </div>
            )}
            {active.example?.caption !== undefined && (
              <p className="text-xs text-surface-500">
                {active.example.caption}
              </p>
            )}
            <LocaleNavLink
              navTarget={glossaryLinkTarget(active.href, locale)}
              linkKind="plain"
              className={TEXT_LINK_CLASSES}
            >
              {viewDetailsLabel}
            </LocaleNavLink>
          </div>
        )}
      </InfoModal>
    </TermModalContext>
  );
}
