import { getLocale, getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { chapterHref } from "@mahjong-scoring/features/routes";
import {
  getChapterI18nPath,
  isColumnChapter,
  type CurriculumChapter,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import type { ChapterRowData } from "./chapter-row";
import { CurriculumTocView } from "./curriculum-toc-view";

interface CurriculumTocProps {
  readonly section: CurriculumSection;
  readonly chapters: readonly CurriculumChapter[];
  /** 完了したレッスン（章）。完了の印を出さない場面では空集合を渡す */
  readonly completedSlugs: ReadonlySet<string>;
  readonly nextSlug: string | undefined;
  /**
   * 章の行に id（`chapterTocAnchorId`）を付けるか。`/lessons` の目次
   * だけが付ける — 抜粋の側が付けると、同じ章が 2 度並ぶページで重複する
   */
  readonly anchored?: boolean;
  /**
   * セクション名の見出しレベル。目次のすぐ上にある見出しの 1 段下を渡す —
   * `/lessons` は h1 の直下なので 2、抜粋（`ChapterTocList`・ダッシュボード）は
   * `SectionTitle` 等の h2 の下に置かれるので 3
   */
  readonly headingLevel: 2 | 3;
}

/**
 * 章を目次の行に渡す形にする（張る先の言語の解決と文言の翻訳）
 * 章行データ生成
 *
 * 張る先は `resolveNavTargetFor(chapterHref(slug), locale)`。日本語では
 * `/lessons/<slug>` のまま、英語ではその章を英語で出していれば英語の href、
 * 出していなければ日本語の href に `crossLocale: true` を付ける（行が
 * 「日本語のみ」の印付きの `<a hrefLang="ja">` になる）。公開状態の判定は
 * サーバー専用なので、クライアントの `ChapterRow` へはこの結果だけを渡す。
 *
 * @param chapters - 行にする章（表示順）
 * @param locale - 目次を置くページの言語
 */
export async function chapterRowsFor(
  chapters: readonly CurriculumChapter[],
  locale: SupportedLocale,
): Promise<ChapterRowData[]> {
  const t = await getTranslations("learnCurriculum");
  return chapters.map((chapter) => {
    const path = getChapterI18nPath(chapter);
    const column = isColumnChapter(chapter);
    return {
      slug: chapter.slug,
      kind: column ? "column" : "lesson",
      section: chapter.section,
      order: chapter.order,
      navTarget: resolveNavTargetFor(chapterHref(chapter.slug), locale),
      // 例: chapters.jantouFu.title / chapters.jantouFu.description
      title: t(`${path}.title`),
      // コラムは説明文を描かない（辞書にも持たせない）
      description: column ? undefined : t(`${path}.description`),
    };
  });
}

/** 今のリクエストの言語（未対応の値なら既定の言語） */
async function requestLocale(): Promise<SupportedLocale> {
  const locale = await getLocale();
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

/**
 * Zenn 書籍目次風の章リスト（セクション階層版）
 *
 * セクション 1 つ分の目次を、サーバーが読んだ完了の props で描く。LP・道場・
 * 試験ページ（`ChapterTocList` 経由）とダッシュボードが使う。描画そのもの
 * （bullet・破線・行の印・コラム）は {@link CurriculumTocView} と `ChapterRow`
 * （クライアント部品）にあり、ここは張る先の言語の解決と文言の翻訳だけを持つ。
 * 言語はリクエストの言語（`getLocale()`。ページが `setRequestLocale` で確定させた
 * 値を読み、headers に落ちない）で、呼び出し側は言語を渡さない。
 *
 * `/lessons` の目次は静的生成で、完了をサーバーで読まないため、これを使わず
 * `LessonsIndex` が行データを受けて `CurriculumTocView` を直接描く
 * （完了の印は `LessonProgressProvider` がクライアントで上書きする）。
 * Provider の無いここでは行は props の印をそのまま描く。
 *
 * @remarks
 * Props だけから描画が決まるため Server Action による完了の記録後も親の
 * 再レンダリングでそのまま反映される。章が無ければ何も描かない。
 */
export async function CurriculumToc({
  section,
  chapters,
  completedSlugs,
  nextSlug,
  anchored = false,
  headingLevel,
}: CurriculumTocProps) {
  if (chapters.length === 0) return undefined;

  const rows = await chapterRowsFor(chapters, await requestLocale());

  return (
    <CurriculumTocView
      section={section}
      rows={rows}
      completedSlugs={chapters
        .map((chapter) => chapter.slug)
        .filter((slug) => completedSlugs.has(slug))}
      nextSlug={nextSlug}
      anchored={anchored}
      headingLevel={headingLevel}
    />
  );
}
