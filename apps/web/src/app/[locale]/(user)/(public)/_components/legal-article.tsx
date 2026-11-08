import type { ReactNode } from "react";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { localizedHref } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { JST_TIME_ZONE } from "@mahjong-scoring/features/jst";

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
 * 外部サイト（Google のポリシー等・運営会社のサイト）は新しいタブで開き、
 * 言語は扱わない。
 *
 * 内部リンクはそのページの言語の公開状態で張る（`resolveNavTargetFor`）。
 * `locale` を必須にしているのは、英語の規約の文中リンクが日本語の URL
 * （接頭辞なし）を指したまま言語をまたぐのを型で防ぐため。
 *
 * - 日本語では渡した href のまま `next/link`（日本語のページの出力は変えない）
 * - その言語で公開しているページなら `/en/...` の `next/link`
 * - 未公開なら日本語の URL のまま素の `<a hrefLang="ja">`（`LocaleNavLink`）に
 *   して「日本語のみ」の印（`JapaneseOnlyMark`）を添える。英語の存在しない URL を
 *   作らず、言語をまたぐことを明示するため
 *
 * 印の文言は `useTranslations` で引く。`t.rich()` のタグ関数から同期で描く
 * 部品なので、非同期にしない。リクエストの言語はページの `prepareRouteLocale`
 * が確定させたもので、`locale` と一致する。
 *
 * @param href - ロケール非依存の href（`/contact`）か、外部 URL
 * @param locale - リンクを置くページの言語
 * @param external - 外部サイトへのリンク
 */
export function LegalLink({
  href,
  locale,
  external = false,
  children,
}: {
  readonly href: string;
  readonly locale: SupportedLocale;
  readonly external?: boolean;
  readonly children?: ReactNode;
}) {
  const tNav = useTranslations("nav");
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
  const target = resolveNavTargetFor(href, locale);
  return (
    <>
      <LocaleNavLink
        navTarget={target}
        linkKind="plain"
        className={TEXT_LINK_CLASSES}
      >
        {children}
      </LocaleNavLink>
      {target.crossLocale && (
        <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
      )}
    </>
  );
}

/**
 * 法務の共通の文言（最終更新日・参考訳の注記）の名前空間。サーバー専用
 *
 * 定数にしているのは、`client-messages.test.ts` がオブジェクトの
 * `namespace: "<名前空間>"` をレジストリの記述とみなしてクライアントからの
 * 参照に数えるため。ここはサーバーの `getTranslations` の引数で、
 * クライアントには渡らない（この名前空間はサーバー専用のまま）。
 */
const LEGAL_NAMESPACE = "legal";

/**
 * 日付の書式に使う Intl のロケール
 *
 * 日本語は従来どおり「2026年10月10日」（`ja` と `ja-JP` は同じ出力）。
 * それ以外は英語の「October 10, 2026」。
 */
function dateFormatLocale(locale: SupportedLocale): string {
  return locale === DEFAULT_LOCALE ? "ja-JP" : "en-US";
}

/**
 * 最終更新日
 *
 * @param date - 改定日（`YYYY-MM-DD`）。日付だけの ISO 文字列は UTC の 0 時と
 *   解釈されるため、日本時間に固定して整形する（サーバーのタイムゾーンに
 *   依らず同じ日付になる。英語でも日本時間の日付にするのは、改定する事業者が
 *   日本時間で日付を決めているため）
 * @param locale - ページの言語。日付の書式と文言を選ぶ
 */
export async function LegalLastUpdated({
  date,
  locale,
}: {
  readonly date: string;
  readonly locale: SupportedLocale;
}) {
  const t = await getTranslations({ locale, namespace: LEGAL_NAMESPACE });
  const formatted = new Intl.DateTimeFormat(dateFormatLocale(locale), {
    dateStyle: "long",
    timeZone: JST_TIME_ZONE,
  }).format(new Date(date));

  return (
    <p className="text-right text-sm text-surface-500">
      <time dateTime={date}>{t("lastUpdated", { date: formatted })}</time>
    </p>
  );
}

/**
 * 英語版が参考訳であることの注記
 * 参考訳注記
 *
 * 利用規約・プライバシーポリシー・特定商取引法に基づく表記の、日本語以外の
 * 版の本文の前に 1 つ置く。訳は参考で、正文（解釈が割れたときに拠る文）は
 * 日本語版であることを示し、日本語の同じページへ張る。英語で法的文書を出す
 * 運営の一般的な守りで、置かない理由が無いため。運営者情報（`/company`）は
 * 事実の列挙で解釈の余地が無いので置かない。
 *
 * - 日本語のページでは何も描かない（`undefined`。日本語の出力を変えない）
 * - 原文へのリンクは日本語の URL（接頭辞なし）へ素の `<a hrefLang="ja">`。
 *   言語をまたぐクライアント遷移は英語の文書に日本語の本文を載せるため、
 *   `LocaleNavLink` の言語をまたぐ形と同じく文書ごと読み込ませる。`lang` は
 *   付けない — リンクの文字（"Japanese version"）自体は英語のため
 * - 見た目は強調のパネル（`HighlightPanel`）ではなく控えめな段落にする
 *   （本文を読む邪魔をしない）
 *
 * @param path - このページのロケール非依存のパス（`/terms`）
 * @param locale - ページの言語
 */
export async function LegalTranslationNote({
  path,
  locale,
}: {
  readonly path: string;
  readonly locale: SupportedLocale;
}) {
  if (locale === DEFAULT_LOCALE) return undefined;
  const t = await getTranslations({ locale, namespace: LEGAL_NAMESPACE });
  return (
    <p className="text-sm text-surface-600">
      {t.rich("translationNote", {
        original: (chunks) => (
          <a
            href={localizedHref(path, DEFAULT_LOCALE)}
            hrefLang={DEFAULT_LOCALE}
            className={TEXT_LINK_CLASSES}
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}

/**
 * 規約の末尾（改定・お問い合わせ・最終更新日）
 * 規約末尾
 *
 * 利用規約とプライバシーポリシーは同じ 3 節で終わる。節の文言は各ページの
 * 名前空間の `revision.*` / `contact.*` から引き、お問い合わせの文中リンクは
 * その言語の `/contact` へ張る（{@link LegalLink}）。
 *
 * @param page - どちらの規約か（辞書の名前空間と同じ名前）
 * @param lastUpdated - 改定日（`YYYY-MM-DD`。{@link LegalLastUpdated}）
 * @param locale - ページの言語
 */
export async function LegalClosing({
  page,
  lastUpdated,
  locale,
}: {
  readonly page: "terms" | "privacy";
  readonly lastUpdated: string;
  readonly locale: SupportedLocale;
}) {
  const t = await getTranslations({ locale, namespace: page });
  return (
    <>
      <LegalSection title={t("revision.title")}>
        <LegalParagraph>{t("revision.body")}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t("contact.title")}>
        <LegalParagraph>
          {t.rich("contact.body", {
            contact: (chunks) => (
              <LegalLink href="/contact" locale={locale}>
                {chunks}
              </LegalLink>
            ),
          })}
        </LegalParagraph>
      </LegalSection>

      <LegalLastUpdated date={lastUpdated} locale={locale} />
    </>
  );
}
