import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { lessonExcerpt } from "@mahjong-scoring/features/lessons/excerpt";

/** 見出しの id。完了画面に 1 つしか出ないので固定でよい */
const HEADING_ID = "next-lesson-preview-title";

interface NextLessonPreviewProps {
  readonly slug: QuizLessonSlug;
  /** ページの言語。「続きを読む」の行き先をこの言語で解決する */
  readonly locale: SupportedLocale;
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
 *
 * 「続きを読む」の行き先はページの言語で解決する（`resolveNavTargetFor`。
 * その言語で出していない章なら日本語の章へ「日本語のみ」の印付き）。完了画面は
 * 確認問題を出す言語でしか描かれない（英語の章はログイン画面が英語で出るまで
 * 確認問題を出さない）ので英語では今は描かれないが、章の前後のリンクと
 * 同じ規則にしておく。
 */
export async function NextLessonPreview({
  slug,
  locale,
}: NextLessonPreviewProps) {
  const chapter = getChapterBySlug(slug);
  if (chapter === undefined) return undefined;

  const [t, tCurriculum, tAll, tNav] = await Promise.all([
    getTranslations("lessons.nextLesson"),
    getTranslations("learnCurriculum"),
    getTranslations(),
    getTranslations("nav.language"),
  ]);
  const target = resolveNavTargetFor(chapterHref(slug), locale);
  const paragraphs = lessonExcerpt(slug, (key) => tAll(key));

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="overflow-hidden rounded-panel border border-panel bg-white"
      data-testid="next-lesson-preview"
    >
      {/* 見出し帯は教本の表（DataTable）のヘッダー行と同じ体裁。節の見出し
          （SectionTitle）にすると「できるようになったこと」との区切りが強すぎ、
          完了の続きではなく別の話題に見える */}
      <h3
        id={HEADING_ID}
        className="border-b border-panel bg-surface-50 px-4 py-3 text-sm font-bold text-surface-700"
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
          <LocaleNavLink
            navTarget={target}
            linkKind="plain"
            className={`text-sm font-bold ${TEXT_LINK_CLASSES}`}
          >
            {t("readMore")}
          </LocaleNavLink>
          {target.crossLocale && (
            <JapaneseOnlyMark label={tNav("japaneseOnly")} />
          )}
        </div>
      </div>
    </section>
  );
}
