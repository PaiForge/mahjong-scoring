import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { ButtonVariant } from "@/app/[locale]/(user)/_components/_lib/button-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

interface LandingSectionProps {
  readonly sectionClassName: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
  /** CTA の行き先（ロケール非依存のパス。張る先は `locale` で決める） */
  readonly href: string;
  /** ページの言語 */
  readonly locale: SupportedLocale;
  readonly ctaLabel: string;
  /** CTA ボタンの系統。塗りが必要なら primary、白抜きなら secondary */
  readonly ctaVariant: ButtonVariant;
  /** 説明文と CTA の間に置く中身（教本の章一覧など）。無ければ何も置かない */
  readonly children?: ReactNode;
}

/**
 * トップの節（アイコン・見出し・説明・CTA）
 *
 * @design CTA の行き先がその言語で未公開なら日本語へ「日本語のみ」の印付きで向ける
 * CTA の張る先は `resolveNavTargetFor(href, locale)`（サーバー）で決める。日本語の
 * ページでは `href` をそのまま `next/link` で張る（日本語の出力は変えない）。
 * 英語のページで行き先が英語で公開していれば `/en` 付きのリンク、未公開
 * （練習一覧・早見表のサンプル等）なら英語の存在しない URL を作らず、日本語の
 * URL へ素の `<a hrefLang="ja">`（`LinkButton` の `navTarget`）で向け、ボタンの
 * 中に `JapaneseOnlyMark` を置いて日本語のページだと明示する。CTA を消さないのは、
 * 節の本文（何ができるか）とその実物への導線を対にしておくため。印で幅が
 * 変わるのはボタンの中だけで、静的な HTML に最初から入るので CLS は出ない。
 */
export function LandingSection({
  sectionClassName,
  icon,
  iconClassName,
  title,
  description,
  href,
  locale,
  ctaLabel,
  ctaVariant,
  children,
}: LandingSectionProps) {
  const tNav = useTranslations("nav");
  const target = resolveNavTargetFor(href, locale);

  return (
    <section className={`px-6 py-24 ${sectionClassName}`}>
      <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
        <div
          className={`flex size-16 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-surface-900">{title}</h2>
        <p className="max-w-2xl text-base md:text-lg leading-relaxed text-surface-500">
          {description}
        </p>
        {children}
        <div className="pt-4">
          <LinkButton navTarget={target} variant={ctaVariant} size="xl">
            {ctaLabel}
            {target.crossLocale && (
              <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
            )}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
