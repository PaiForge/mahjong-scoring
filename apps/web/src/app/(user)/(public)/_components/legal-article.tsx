import type { ReactNode } from "react";

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { DEFAULT_LOCALE } from "@/i18n/locales";

/**
 * 規約系ページ（利用規約・プライバシーポリシー）の本文部品
 * 規約本文
 *
 * 見出し + 段落 + 箇条書きの繰り返しだけで組む文書の、その 3 つの見た目を
 * ここに閉じる。教本の `GuideParagraph` を使わないのは、あちらが用語
 * マークアップ（`[[slug|表示語]]`）を解いて用語リンクにするためで、
 * 規約の文中に用語リンクが混ざるのは望ましくない。
 */
export function LegalArticle({ children }: { readonly children: ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

/** 規約の 1 節。見出し pill の下に段落・箇条書きを並べる */
export function LegalSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

/** 規約の段落。辞書の改行（\n）はそのまま改行にする */
export function LegalParagraph({ children }: { readonly children: ReactNode }) {
  return (
    <p className="whitespace-pre-line text-sm leading-relaxed text-surface-700">
      {children}
    </p>
  );
}

/** 規約の箇条書き。`<li>` を子に渡す */
export function LegalList({ children }: { readonly children: ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6 text-sm leading-relaxed text-surface-700">
      {children}
    </ul>
  );
}

/**
 * 規約の文中のリンク。`t.rich()` のタグ関数から使う
 *
 * 外部サイト（Google のポリシー等）は新しいタブで開く。
 */
export function LegalLink({
  href,
  external = false,
  children,
}: {
  readonly href: string;
  readonly external?: boolean;
  readonly children?: ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={TEXT_LINK_CLASSES}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={TEXT_LINK_CLASSES}>
      {children}
    </Link>
  );
}

/**
 * 最終更新日
 *
 * @param date - 改定日（`YYYY-MM-DD`）。日付だけの ISO 文字列は UTC の 0 時と
 *   解釈されるため、日本時間に固定して整形する（サーバーのタイムゾーンに
 *   依らず同じ日付になる）
 */
export async function LegalLastUpdated({ date }: { readonly date: string }) {
  const t = await getTranslations("legal");
  const formatted = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date(date));

  return (
    <p className="text-right text-sm text-surface-500">
      <time dateTime={date}>{t("lastUpdated", { date: formatted })}</time>
    </p>
  );
}
