import { getTranslations } from "next-intl/server";
import { getLocaleLinks } from "@/app/[locale]/(user)/_components/_lib/locale-link-table";
import { resolveNavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import {
  LinkRow,
  LinkRowList,
} from "@/app/[locale]/(user)/_components/link-row";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import {
  relatedReferences,
  type ReferenceKey,
} from "@mahjong-scoring/features/reference/related-references";

/** web の点数表のパス（アプリはタブの `/score-table`） */
const SCORE_TABLE_PATH = "/reference/score-table";

/**
 * 早見表の下に置く「ほかの早見表」の行（自分を除く）
 * 関連早見表セクション
 *
 * 英語のページ（英語の点数表）では、英語版のある早見表は `/en` の対訳へ、
 * 英語版の無い早見表（役一覧・用語集）は日本語のページへ素のリンクで向け、
 * 行末に「日本語のみ」と添える。英語の存在しない URL を作らず、行き先の
 * 言語を偽らないため。日本語のページでは今までどおりの行を出す。
 *
 * @param current - このセクションを置く早見表
 */
export async function RelatedReferencesSection({
  current,
}: {
  readonly current: ReferenceKey;
}) {
  const t = await getTranslations("reference");
  const tNav = await getTranslations("nav");
  const localeLinks = await getLocaleLinks();
  return (
    <section className="space-y-4">
      <SectionTitle>{t("relatedTitle")}</SectionTitle>
      <LinkRowList>
        {relatedReferences(current, SCORE_TABLE_PATH).map(({ key, href }) => {
          const target = resolveNavTarget(href, localeLinks);
          return (
            <LinkRow
              key={key}
              href={target.href}
              hrefLang={target.crossLocale ? DEFAULT_LOCALE : undefined}
              // 完成形のキーの例: reference.yaku.title / reference.glossary.description
              title={t(`${key}.title`)}
              description={t(`${key}.description`)}
              trailing={
                target.crossLocale ? (
                  <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
                ) : undefined
              }
            />
          );
        })}
      </LinkRowList>
    </section>
  );
}
