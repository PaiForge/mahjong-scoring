import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { resolvePublishedHref } from "@/i18n/navigation";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

/**
 * Not Found（言語別）
 *
 * `app/[locale]` 配下のページ・レイアウトが `notFound()` を呼んだときに、
 * 言語レイアウトの中（`<html lang>` と辞書はその言語のまま）に出る 404。
 * どのルートにも当たらない URL は `app/not-found.tsx`（言語を持たない簡潔な
 * 日本語の HTML）が受ける。
 *
 * 文言は `notFound` 名前空間（英語は完訳。英語の 404 が読む名前空間は
 * `EN_NOT_FOUND_NAMESPACES`）。ロケールは言語レイアウトが `setRequestLocale` で
 * 確定させた値を読む（`getLocale()` は headers に落ちない）。リンクはその言語で
 * 公開しているページだけを出す — 英語の練習一覧は未公開なので出さず、ホームは
 * 英語のトップが未公開なら日本語のトップへ向ける（404 から 404 へ案内しない）。
 */
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");
  const practiceHref = resolvePublishedHref(PRACTICE_PATH, locale);

  return (
    <ContentContainer>
      <div className="flex flex-col items-center text-center py-12">
        <p className="text-6xl font-light text-surface-400 mb-4">404</p>
        <PageTitle className="mb-3">{t("title")}</PageTitle>
        <p className="text-sm text-surface-600 mb-8">{t("description")}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <LinkButton href={resolvePublishedHref("/", locale) ?? "/"}>
            {t("goHome")}
          </LinkButton>
          {practiceHref !== undefined && (
            <Link
              href={practiceHref}
              className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
            >
              {t("toPractice")}
            </Link>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
