import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

interface LocalizedTextLinkProps {
  /** ロケール非依存のパス（`/reference/glossary/jantou`） */
  readonly path: string;
  /** リンクを置くページの言語 */
  readonly locale: SupportedLocale;
  /** `TEXT_LINK_CLASSES` の前に足す class（文字の大きさ等） */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * 用語集の本文中のテキストリンク（ページの言語で張る）
 * 用語集の言語付きリンク
 *
 * 用語集・用語ページの中のリンク（分類の索引・関連語・一覧へ戻る）は、
 * 日本語のページでは今までどおり `next/link` でロケール非依存のパスへ張る。
 * 英語のページでは `resolveNavTargetFor` でその言語の公開 URL
 * （`/en/reference/glossary/...`）へ張り、その言語で出していないページなら
 * 日本語のページへ素の `<a hrefLang="ja">` で向けて「日本語のみ」と添える
 * （英語の存在しない URL を作らない）。
 */
export async function LocalizedTextLink({
  path,
  locale,
  className,
  children,
}: LocalizedTextLinkProps) {
  const target = resolveNavTargetFor(path, locale);
  const linkClassName = `${className === undefined ? "" : `${className} `}${TEXT_LINK_CLASSES}`;
  const link = (
    <LocaleNavLink
      navTarget={target}
      linkKind="plain"
      className={linkClassName}
    >
      {children}
    </LocaleNavLink>
  );
  if (!target.crossLocale) return link;

  const tNav = await getTranslations("nav");
  return (
    <>
      {link}
      <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
    </>
  );
}
