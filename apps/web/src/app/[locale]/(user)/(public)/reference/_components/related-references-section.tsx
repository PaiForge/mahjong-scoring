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
 * 点数表・役一覧・用語集の 3 つのページに置く。行き先は公開 href の表
 * （`getLocaleLinks` → `resolveNavTarget`）で決め、ページの言語でその早見表を
 * 出していれば同じ言語の URL へ、出していなければ日本語のページへ素のリンク
 * （`hrefLang="ja"`）で向けて行末に「日本語のみ」と添える。英語の存在しない
 * URL を作らず、行き先の言語を偽らないため。
 *
 * 今は 3 つとも英語で公開しているので、英語のページの行はすべて `/en` の対訳へ
 * 向き、「日本語のみ」の行は出ない。早見表を足して英語の公開が後になる場合に
 * 備えて、言語をまたぐ行の描き方は残してある（テストは表を絞って確かめる）。
 * 日本語のページでは接頭辞なしの行をそのまま出す。
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
