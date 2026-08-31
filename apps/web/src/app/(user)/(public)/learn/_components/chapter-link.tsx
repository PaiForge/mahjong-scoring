import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import {
  chapterHref,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";

interface ChapterLinkProps {
  /** リンク先の章 */
  readonly slug: CurriculumChapterSlug;
}

/**
 * 別の章へのテキストリンク
 * 章リンク
 *
 * 表示する文字はカリキュラムの章タイトルを引く。本文の辞書に章名を書き写すと、
 * 章を改名したときに参照側が古い名前のまま残る（そして typecheck も lint も
 * 落ちない）。slug だけを持たせておけば、タイトルの変更は勝手に追随する。
 *
 * 本文中で使うときは `t.rich(..., { link: () => <ChapterLink slug="..." /> })`
 * の形で埋める。`t.rich` の戻り値は文字列ではないため用語マークアップ
 * （`[[slug|表示語]]`）の変換が働かない。リンクを含む段落には用語マークアップを
 * 書かないこと（コラム本文と同じ制約）。
 */
export async function ChapterLink({ slug }: ChapterLinkProps) {
  const t = await getTranslations("learnCurriculum");
  const chapter = getChapterBySlug(slug);

  return (
    <Link href={chapterHref(slug)} className={TEXT_LINK_CLASSES}>
      {chapter ? t(`${getChapterI18nPath(chapter)}.title`) : slug}
    </Link>
  );
}
