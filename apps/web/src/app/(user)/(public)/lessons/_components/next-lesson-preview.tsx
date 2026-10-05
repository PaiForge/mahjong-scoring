import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { lessonExcerpt } from "../_lib/lesson-excerpt";

/** 見出しの id。完了画面に 1 つしか出ないので固定でよい */
const HEADING_ID = "next-lesson-preview-title";

interface NextLessonPreviewProps {
  readonly slug: QuizLessonSlug;
}

/**
 * 完了画面の「次のレッスン」— 次のレッスンの冒頭を見せて続きへ送る
 * 次のレッスンのプレビュー
 *
 * Server Component。黒帯への道でこのレッスンの次がレッスンのときに、
 * 「できるようになったこと」のすぐ下へ、ボタンの代わりに出す。行き先の
 * 名前だけのボタンより、実際の書き出しを 3 行ほど読ませた方が「続きを
 * 読みたい」で次へ進める。
 *
 * 抜粋は 3 行で切り、下端を地の色へ溶かして続きがあることを示す。
 * 表示されない部分も DOM には残るが、読み上げでは続きまで読まれるだけで
 * 害はない（リンクは抜粋の中に置かない — `lessonExcerpt` がマークアップを外す）。
 * 題名は章の辞書（`learnCurriculum.chapters`）から引く — レッスン = 章なので、
 * 別の題名を持たない。
 */
export async function NextLessonPreview({ slug }: NextLessonPreviewProps) {
  const chapter = getChapterBySlug(slug);
  if (chapter === undefined) return undefined;

  const [t, tCurriculum, paragraphs] = await Promise.all([
    getTranslations("lessons.nextLesson"),
    getTranslations("learnCurriculum"),
    lessonExcerpt(slug),
  ]);

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="overflow-hidden rounded-xl border-3 border-ink bg-white"
      data-testid="next-lesson-preview"
    >
      {/* 見出し帯は教本の表（DataTable）のヘッダー行と同じ体裁。節の見出し
          （SectionTitle）にすると「できるようになったこと」との区切りが強すぎ、
          完了の続きではなく別の話題に見える */}
      <h3
        id={HEADING_ID}
        className="border-b-3 border-ink bg-primary-50 px-4 py-3 text-sm font-bold text-surface-700"
      >
        {t("title")}
      </h3>
      <div className="space-y-3 px-4 py-4">
        <p className="text-base font-bold text-surface-900">
          {tCurriculum(`${getChapterI18nPath(chapter)}.title`)}
        </p>
        {/* lh は行の高さ。段落の間隔ぶん、3 行より少し短く切れることがある */}
        <div className="relative max-h-[3lh] overflow-hidden text-sm leading-relaxed text-surface-700">
          <div className="space-y-2 whitespace-pre-line">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[1lh] bg-gradient-to-t from-white to-transparent"
          />
        </div>
        <div className="text-center">
          <Link
            href={chapterHref(slug)}
            className={`text-sm font-bold ${TEXT_LINK_CLASSES}`}
          >
            {t("readMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
