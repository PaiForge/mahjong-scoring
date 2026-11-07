import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";

interface StepCardProps {
  readonly stepLabel?: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  /** CTA の張る先（`resolveNavTargetFor(href, locale)` の結果） */
  readonly ctaTarget: NavTarget;
  readonly subLabel?: string;
  /** 補助リンクの張る先（`resolveNavTargetFor(href, locale)` の結果） */
  readonly subTarget?: NavTarget;
}

/**
 * はじめ方ガイドのステップ 1 枚
 * ステップカード
 *
 * 張る先は href ではなく解決済みの {@link NavTarget} で受ける。`LinkButton` の
 * `href` 指定は常に `next/link` を描き、英語のページから日本語だけのページへ
 * クライアント遷移すると英語の文書に日本語の本文が載るため。同じ言語で公開して
 * いる行き先は今までどおり `next/link`、未公開なら素の `<a hrefLang="ja">` と
 * 「日本語のみ」の印になる（今の行き先はすべて英語でも公開している）。
 */
export function StepCard({
  stepLabel,
  icon,
  iconClassName,
  title,
  description,
  ctaLabel,
  ctaTarget,
  subLabel,
  subTarget,
}: StepCardProps) {
  return (
    <div className="flex flex-col items-center space-y-4 rounded-panel border border-panel bg-white p-6 text-center">
      {stepLabel ? (
        <span className="text-xs font-bold tracking-wider text-surface-500">
          {stepLabel}
        </span>
      ) : null}
      <div
        className={`flex size-14 items-center justify-center rounded-lg ${iconClassName}`}
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      <p className="text-sm leading-relaxed text-surface-500">{description}</p>
      <div
        className={`mt-auto flex w-full flex-col items-center ${SUB_LINK_GAP} pt-2`}
      >
        <LinkButton navTarget={ctaTarget}>
          {ctaLabel}
          {ctaTarget.crossLocale && <CrossLocaleMark />}
        </LinkButton>
        <div className="flex min-h-5 items-center">
          {subLabel && subTarget ? (
            <LocaleNavLink
              navTarget={subTarget}
              linkKind="plain"
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {subLabel}
              {subTarget.crossLocale && <CrossLocaleMark />}
            </LocaleNavLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** 言語をまたぐリンクに添える「日本語のみ」の印（言語をまたぐときだけ辞書を読む） */
function CrossLocaleMark() {
  const tNav = useTranslations("nav");
  return <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />;
}
