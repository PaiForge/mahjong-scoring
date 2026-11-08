import { useTranslations } from "next-intl";

import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { resolvePublishedHref } from "@/i18n/navigation";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";

/** ヒーローの CTA の本来の行き先（登録前の案内ページ） */
const GETTING_STARTED_PATH = "/getting-started";

/**
 * ヒーローの CTA の張る先
 * ヒーローCTA解決
 *
 * @design 案内ページがその言語で未公開ならレッスンの目次へ向ける
 * 本来の行き先は `/getting-started`（日本語では常にここ。日本語の出力は変えない）。
 * 英語では案内ページが未公開の間、主導線を日本語の案内ページへ飛ばすと LP が
 * 英語の入口として壊れる（最初のボタンで日本語の文書に落ちる）。レッスンは英語で
 * 出す中で唯一の「始める」先なので、そちらへ向ける。判定は言語の分岐ではなく
 * 公開状態（`resolvePublishedHref`）なので、案内ページを英語で公開した時点で
 * 自動的に本来の行き先へ戻る。レッスンの目次も未公開の言語では、他の節の CTA と
 * 同じ規則（日本語へ「日本語のみ」の印付き）に落とす。
 *
 * @param locale - ページの言語
 */
export function heroCtaTarget(locale: SupportedLocale): NavTarget {
  const gettingStarted = resolvePublishedHref(GETTING_STARTED_PATH, locale);
  if (gettingStarted !== undefined) {
    return { href: gettingStarted, crossLocale: false };
  }
  return resolveNavTargetFor(LESSONS_PATH, locale);
}

/**
 * トップのヒーロー（見出し・説明・主導線の CTA）
 *
 * CTA は本文の主導線なので、同じ言語の遷移は素の `next/link`（`LinkButton`）の
 * まま先読みさせる。
 *
 * @param locale - ページの言語（CTA の張る先を決める）
 */
export function HeroSection({ locale }: { readonly locale: SupportedLocale }) {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const target = heroCtaTarget(locale);

  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="text-3xl font-bold md:text-5xl whitespace-pre-line">
          {t("heroTitle")}
        </h1>
        <p className="text-base text-primary-100 md:text-lg">
          {t("heroDescription")}
        </p>
        <div className="flex justify-center">
          <LinkButton navTarget={target} variant="secondary" size="xl">
            {t("ctaGetStarted")}
            {target.crossLocale && (
              <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
            )}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
