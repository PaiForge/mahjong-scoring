import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Divider } from "@/app/_components/divider";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";
import {
  getAdjacentChapters,
  getChapterI18nPath,
  type CurriculumChapter,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";

interface ChapterNavProps {
  /** 現在の章スラッグ */
  readonly slug: CurriculumChapterSlug;
}

interface ChapterNavLinkProps {
  readonly chapter: CurriculumChapter;
  readonly direction: "prev" | "next";
  readonly label: string;
  readonly title: string;
}

/**
 * 章ページの前後リンク
 * 章ナビゲーション
 *
 * 現在の章の前後章を1行のテキストリンクで左右に表示する。ページ下部で主張すべきは
 * 練習への CTA なので、二次的な導線であるここは枠を持たせず軽くする。
 * 先頭章では prev スロットを、末尾章では next スロットを非表示にする。
 */
export async function ChapterNav({ slug }: ChapterNavProps) {
  const t = await getTranslations("learnCurriculum");
  const tChapter = await getTranslations("learnCurriculum.chapter");
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
            chapter={prev}
            direction="prev"
            label={tChapter("prevChapterLabel")}
            title={t(`${getChapterI18nPath(prev)}.title`)}
          />
        )}
        {next && (
          <ChapterNavLink
            chapter={next}
            direction="next"
            label={tChapter("nextChapterLabel")}
            title={t(`${getChapterI18nPath(next)}.title`)}
          />
        )}
      </nav>
    </div>
  );
}

function ChapterNavLink({
  chapter,
  direction,
  label,
  title,
}: ChapterNavLinkProps) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/learn/${chapter.slug}`}
      // 先頭章では prev が無いので、next 単独でも右端に寄るよう ml-auto を持たせる。
      className={`inline-flex min-w-0 items-center gap-2 text-sm text-primary-600 underline-offset-4 transition-colors hover:text-primary-700 hover:underline ${
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
      {isNext && <ChevronRightIcon className="size-4 shrink-0" />}
    </Link>
  );
}
