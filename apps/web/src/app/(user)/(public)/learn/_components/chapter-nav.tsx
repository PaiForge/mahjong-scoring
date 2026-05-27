import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

interface ChapterNavCardProps {
  readonly chapter: CurriculumChapter;
  readonly direction: "prev" | "next";
  readonly label: string;
  readonly title: string;
}

/**
 * 章ページの前後リンク
 * 章ナビゲーション
 *
 * 現在の章の前後章をカード風リンクで表示する。
 * 先頭章では prev スロットを、末尾章では next スロットを非表示にする。
 */
export async function ChapterNav({ slug }: ChapterNavProps) {
  const t = await getTranslations("learnCurriculum");
  const tChapter = await getTranslations("learnCurriculum.chapter");
  const { prev, next } = getAdjacentChapters(slug);

  if (!prev && !next) return undefined;

  return (
    <nav
      aria-label={tChapter("prevChapterLabel")}
      className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      {prev ? (
        <ChapterNavCard
          chapter={prev}
          direction="prev"
          label={tChapter("prevChapterLabel")}
          title={t(`${getChapterI18nPath(prev)}.title`)}
        />
      ) : (
        <div aria-hidden="true" />
      )}
      {next ? (
        <ChapterNavCard
          chapter={next}
          direction="next"
          label={tChapter("nextChapterLabel")}
          title={t(`${getChapterI18nPath(next)}.title`)}
        />
      ) : (
        <div aria-hidden="true" />
      )}
    </nav>
  );
}

function ChapterNavCard({ chapter, direction, label, title }: ChapterNavCardProps) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/learn/${chapter.slug}`}
      className={`flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-colors hover:bg-surface-50 ${
        isNext ? "md:col-start-2 md:justify-end md:text-right" : ""
      }`}
    >
      {!isNext && (
        <ChevronRightIcon className="size-5 shrink-0 rotate-180 text-surface-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-surface-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-surface-900">
          {title}
        </p>
      </div>
      {isNext && (
        <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
      )}
    </Link>
  );
}
