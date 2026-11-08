import { getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  LinkRow,
  LinkRowList,
} from "@/app/[locale]/(user)/_components/link-row";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { chapterHref } from "@mahjong-scoring/features/routes";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import {
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";

interface TermLearnLinksProps {
  readonly slugs: readonly CurriculumChapterSlug[];
  /** ページの言語（章へのリンクの言語） */
  readonly locale: SupportedLocale;
}

/**
 * その用語を扱っている教本の章へのリンク
 * 用語からの章導線
 *
 * 用語ページは語の意味までしか説明しない。「なぜその符になるのか」を
 * 知りたくなった読者を、語の定義で止めずに章へ送る。
 *
 * 章へのリンクはページの言語で張る（`resolveNavTargetFor`）。英語で出して
 * いない章（いまは用語から指す章には無いが、レジストリに足されうる）は
 * 日本語のページへ素のリンクで向け、行末に「日本語のみ」と添える。
 */
export async function TermLearnLinks({ slugs, locale }: TermLearnLinksProps) {
  const t = await getTranslations("learnCurriculum");
  const tNav = await getTranslations("nav");

  return (
    <LinkRowList>
      {slugs.map((slug) => {
        const chapter = getChapterBySlug(slug);
        if (!chapter) return undefined;

        const i18nPath = getChapterI18nPath(chapter);
        const target = resolveNavTargetFor(chapterHref(slug), locale);
        return (
          <LinkRow
            key={slug}
            href={target.href}
            hrefLang={target.crossLocale ? DEFAULT_LOCALE : undefined}
            // 完成形のキーの例: learnCurriculum.chapters.jantouFu.title
            title={t(`${i18nPath}.title`)}
            description={t(`${i18nPath}.description`)}
            trailing={
              target.crossLocale ? (
                <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
              ) : undefined
            }
          />
        );
      })}
    </LinkRowList>
  );
}
