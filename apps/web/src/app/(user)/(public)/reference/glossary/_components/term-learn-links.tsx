import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import {
  chapterHref,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@/app/(user)/(public)/learn/_lib/curriculum";

interface TermLearnLinksProps {
  readonly slugs: readonly CurriculumChapterSlug[];
}

/**
 * その用語を扱っている教本の章へのリンク
 * 用語からの章導線
 *
 * 用語ページは語の意味までしか説明しない。「なぜその符になるのか」を
 * 知りたくなった読者を、語の定義で止めずに章へ送る。
 */
export async function TermLearnLinks({ slugs }: TermLearnLinksProps) {
  const t = await getTranslations("learnCurriculum");

  return (
    <LinkRowList>
      {slugs.map((slug) => {
        const chapter = getChapterBySlug(slug);
        if (!chapter) return undefined;

        const i18nPath = getChapterI18nPath(chapter);
        return (
          <LinkRow
            key={slug}
            href={chapterHref(slug)}
            title={t(`${i18nPath}.title`)}
            description={t(`${i18nPath}.description`)}
          />
        );
      })}
    </LinkRowList>
  );
}
