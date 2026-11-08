import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { Announcement } from "@/lib/db";

import {
  ANNOUNCEMENT_LIST_DATE_OPTIONS,
  formatPublishedDate,
} from "@mahjong-scoring/features/announcements/format";

/**
 * 行の詳細ページへの張り方
 * お知らせ詳細リンク
 *
 * 呼び出し側（ページ）が公開状態を引いて決め、この部品は受け取った値で
 * 描くだけにする（公開状態の判定を部品ごとに持たない）。
 */
export interface AnnouncementDetailLink {
  /**
   * 行の詳細ページの張り先。ロケール非依存のパス（`/announcements/<slug>`）を
   * 受け、ページの言語で `resolveNavTargetFor` に通した結果を返す
   */
  readonly targetFor: (path: string) => NavTarget;
  /** 言語をまたぐ行に添える「日本語のみ」（`nav.language.japaneseOnly`） */
  readonly japaneseOnlyLabel: string;
}

interface AnnouncementTextListProps {
  readonly announcements: readonly Announcement[];
  readonly locale: string;
  /** 翻訳済みの「ピン留め」ラベル */
  readonly pinnedLabel: string;
  /**
   * リストの末尾に混ぜる広告の行（`NativeAdRow`）。一覧ページだけが渡す。
   * リストは `data-framed` を持ち、広告の行は枠の中の余白に切り替わる
   */
  readonly trailingAd?: ReactNode;
  /**
   * 行の詳細ページへの張り方。省略すると同じ言語の `/announcements/<slug>` へ
   * `next/link` で張る（日本語のダッシュボードと一覧ページ）。英語の
   * ダッシュボードのように、お知らせの詳細を出していない言語のページから
   * 使うときに渡す
   */
  readonly detailLink?: AnnouncementDetailLink;
}

const ROW_LINK_CLASSES =
  "group flex min-h-16 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5";

/**
 * 1 行の本文（公開日・タイトル・ピン留め）
 *
 * `title` はタイトルの中身。言語をまたがない行では素のタイトルの文字列を
 * そのまま渡し、日本語の出力（RSC のペイロードの children の形まで）を
 * 英語化の前と同じに保つ。
 */
function rowBody(
  announcement: Announcement,
  locale: string,
  pinnedLabel: string,
  title: ReactNode,
) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-5">
      <time
        dateTime={
          announcement.publishedAt
            ? new Date(announcement.publishedAt).toISOString()
            : undefined
        }
        className="shrink-0 text-xs font-medium tabular-nums text-surface-500"
      >
        {formatPublishedDate(
          announcement.publishedAt,
          locale,
          ANNOUNCEMENT_LIST_DATE_OPTIONS,
        )}
      </time>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-bold leading-relaxed text-foreground [overflow-wrap:anywhere]">
          {title}
        </span>
        {announcement.pinnedAt !== null && (
          <span className="shrink-0 rounded-md bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand-subtle-foreground">
            {pinnedLabel}
          </span>
        )}
      </span>
    </span>
  );
}

/** 行の右端のシェブロン */
function rowChevron() {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 text-surface-400 group-hover:text-foreground"
    >
      <ChevronRightIcon />
    </span>
  );
}

/**
 * ホームと一覧ページで共有する、公開日とタイトルを揃えたお知らせリスト。
 *
 * 行の詳細ページへのリンクは既定で同じ言語の `next/link`。`detailLink` を
 * 渡すと、その張り先が言語をまたぐ行（英語のページから英語で未公開の
 * お知らせの詳細へ）は素の `<a hrefLang="ja">`（`LocaleNavLink`）にして
 * 文書ごと読み込み、タイトルに「日本語のみ」の印を添える。クライアント遷移で
 * 言語をまたぐと英語の文書に日本語の本文が載るため（`LocaleNavLink` の TSDoc）。
 */
export function AnnouncementTextList({
  announcements,
  locale,
  pinnedLabel,
  trailingAd,
  detailLink,
}: AnnouncementTextListProps) {
  return (
    <ul
      data-framed=""
      className="group/rows divide-y divide-surface-100 overflow-hidden rounded-panel border border-panel bg-card"
    >
      {announcements.map((announcement) => {
        if (detailLink === undefined) {
          return (
            <li key={announcement.id}>
              <Link
                href={`/announcements/${announcement.slug}`}
                className={ROW_LINK_CLASSES}
              >
                {rowBody(announcement, locale, pinnedLabel, announcement.title)}
                {rowChevron()}
              </Link>
            </li>
          );
        }
        const target = detailLink.targetFor(
          `/announcements/${announcement.slug}`,
        );
        const title = target.crossLocale ? (
          <>
            {announcement.title}
            <JapaneseOnlyMark label={detailLink.japaneseOnlyLabel} />
          </>
        ) : (
          announcement.title
        );
        return (
          <li key={announcement.id}>
            <LocaleNavLink
              navTarget={target}
              linkKind="plain"
              className={ROW_LINK_CLASSES}
            >
              {rowBody(announcement, locale, pinnedLabel, title)}
              {rowChevron()}
            </LocaleNavLink>
          </li>
        );
      })}
      {trailingAd}
    </ul>
  );
}
