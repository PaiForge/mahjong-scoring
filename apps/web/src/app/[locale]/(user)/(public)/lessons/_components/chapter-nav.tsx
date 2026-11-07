import { getTranslations } from "next-intl/server";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { Divider } from "@/app/[locale]/(user)/_components/divider";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { chapterHref } from "@mahjong-scoring/features/routes";
import {
  getAdjacentChapters,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

interface ChapterNavProps {
  /** 現在の章スラッグ */
  readonly slug: CurriculumChapterSlug;
  /** ページの言語。前後の章へのリンクをこの言語で解決する */
  readonly locale: SupportedLocale;
}

interface ChapterNavLinkProps {
  /** `resolveNavTargetFor(chapterHref(slug), locale)` の結果 */
  readonly navTarget: NavTarget;
  readonly direction: "prev" | "next";
  readonly label: string;
  readonly title: string;
  /** 言語をまたぐときに添える「日本語のみ」 */
  readonly japaneseOnlyLabel: string;
}

/**
 * 章ページの前後リンク
 * 章ナビゲーション
 *
 * 現在の章の前後章を1行のテキストリンクで左右に表示する。ページ下部で主張すべきは
 * 練習への CTA なので、二次的な導線であるここは枠を持たせず軽くする。
 * 先頭章では prev スロットを、末尾章では next スロットを非表示にする。
 *
 * 前後の章はページの言語で解決する（`resolveNavTargetFor`）。その言語で
 * 出していない章（英語の「はじめに」等）は日本語の章へ「日本語のみ」の印付きで
 * 張り、英語の存在しない URL を作らない。前後の並びは言語に依らず同じにする
 * （言語で順路が変わると、同じ章の前後が言語ごとに違って見える）。
 */
export async function ChapterNav({ slug, locale }: ChapterNavProps) {
  const t = await getTranslations("learnCurriculum");
  const tChapter = await getTranslations("learnCurriculum.chapter");
  const tNav = await getTranslations("nav.language");
  const japaneseOnlyLabel = tNav("japaneseOnly");
  const { prev, next } = getAdjacentChapters(slug);

  if (!prev && !next) return undefined;

  return (
    <div className="space-y-6">
      <Divider />
      <nav
        aria-label={tChapter("chapterNavLabel")}
        className="flex items-center justify-between gap-4"
      >
        {prev && (
          <ChapterNavLink
            navTarget={resolveNavTargetFor(chapterHref(prev.slug), locale)}
            direction="prev"
            japaneseOnlyLabel={japaneseOnlyLabel}
            label={tChapter("prevChapterLabel")}
            title={t(`${getChapterI18nPath(prev)}.title`)}
          />
        )}
        {next && (
          <ChapterNavLink
            navTarget={resolveNavTargetFor(chapterHref(next.slug), locale)}
            direction="next"
            japaneseOnlyLabel={japaneseOnlyLabel}
            label={tChapter("nextChapterLabel")}
            title={t(`${getChapterI18nPath(next)}.title`)}
          />
        )}
      </nav>
    </div>
  );
}

function ChapterNavLink({
  navTarget,
  direction,
  label,
  title,
  japaneseOnlyLabel,
}: ChapterNavLinkProps) {
  const isNext = direction === "next";
  return (
    <LocaleNavLink
      navTarget={navTarget}
      linkKind="plain"
      // 先頭章では prev が無いので、next 単独でも右端に寄るよう ml-auto を持たせる。
      className={`inline-flex min-w-0 items-center gap-2 text-sm ${TEXT_LINK_CLASSES} ${
        isNext ? "ml-auto" : ""
      }`}
    >
      {!isNext && <ChevronRightIcon className="size-4 shrink-0 rotate-180" />}
      {/* 狭い画面では章名の表示幅を優先し、方向はチェブロンに委ねる
          （読み上げには残すため hidden ではなく sr-only を使う）。 */}
      <span className="sr-only shrink-0 text-surface-500 sm:not-sr-only">
        {label}
      </span>
      <span className="truncate">{title}</span>
      {navTarget.crossLocale && <JapaneseOnlyMark label={japaneseOnlyLabel} />}
      {isNext && <ChevronRightIcon className="size-4 shrink-0" />}
    </LocaleNavLink>
  );
}
