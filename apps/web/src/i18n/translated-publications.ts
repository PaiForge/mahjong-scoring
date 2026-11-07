import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { localizedHref, splitHref } from "./public-path";

/**
 * 既定以外の言語で公開しているページ（許可リスト）
 * 翻訳公開表
 *
 * `route-policy.ts` の英語の分類の正本。日本語の分類（sitemap のレジストリを
 * 読む）と切り離して、クライアントのツリーからも読めるようにしてある。
 *
 * @design クライアントから読める軽い表として分ける
 * パンくず（クライアントのコンポーネントからも描かれる）とエラー境界
 * （`"use client"`）は、英語のページで「この段・このリンク先は英語で出しているか」を
 * 知りたい。`route-policy.ts` を直接 import すると、日本語の分類が読む sitemap の
 * レジストリ（教本・用語・段級位・料金）ごとクライアントの JS に載る（LP が読む
 * チャンクにも入っていた）。クライアントが要るのは既定以外の言語の許可リストだけ
 * なので、それをこのモジュールに置き、`route-policy.ts` もここを読む（判定を
 * 二重に持たない）。このモジュールに重いレジストリの import を足さない
 * （`client-bundle-boundaries.test.ts` がクライアントからの到達を検査する）。
 */

/**
 * ページの公開状態
 *
 * - `unpublished` — その言語では出していない。英語なら proxy が 404 を返す
 * - `published-noindex` — 出しているが索引させない。sitemap・hreflang に載せない
 *   （noindex 指定のページ、robots で除外したページ、認証フロー等を含む）
 * - `published-indexable` — 出して索引させる。canonical・sitemap・hreflang の対象
 */
export type Publication =
  "unpublished" | "published-noindex" | "published-indexable";

/** 既定（日本語）以外の対応言語 */
export type TranslatedLocale = Exclude<SupportedLocale, typeof DEFAULT_LOCALE>;

/**
 * 動的ルートのテンプレート 1 件の公開状態
 *
 * `template` は `app/[locale]` のディレクトリと同じ形（`/reference/glossary/[slug]`）、
 * `pattern` はそのテンプレートに合うロケール非依存のパス。
 */
interface TranslatedTemplate {
  readonly template: string;
  readonly pattern: RegExp;
  readonly publication: Publication;
}

/** 1 言語の許可リスト（完全一致の行と、動的ルートのテンプレート） */
interface TranslatedPublicationTable {
  readonly paths: ReadonlyMap<string, Publication>;
  readonly templates: readonly TranslatedTemplate[];
}

/**
 * 英語で公開するレッスンの章（`/lessons/<slug>`）
 *
 * 目次に載る 20 章のうち `about-this-app`（はじめに）を除く 19 章。はじめには
 * アプリの使い方（練習・チャレンジ・道場の画面の紹介）の章で、紹介する画面が
 * どれも英語で未公開のため、それらを訳すフェーズ 3 で一緒に訳す。それまで
 * 英語の目次では「日本語のみ」の印付きで日本語の章へリンクする。
 *
 * クライアントからも読む表なので、カリキュラムのレジストリを import せず
 * 文字列で持つ。レジストリとの食い違い（章の改名・追加）は
 * `translated-publications.test.ts` が落とす。
 */
const EN_LESSON_PATHS = [
  "/lessons/why-scoring-is-hard-to-learn",
  "/lessons/why-scoring-is-complex",
  "/lessons/mangan-ko-ron",
  "/lessons/mangan-ko-tsumo",
  "/lessons/mangan-oya-ron",
  "/lessons/mangan-oya-tsumo",
  "/lessons/yaku",
  "/lessons/jantou-fu",
  "/lessons/mentsu-fu",
  "/lessons/machi-fu",
  "/lessons/tehai-fu",
  "/lessons/chiitoitsu-score",
  "/lessons/pinfu-score",
  "/lessons/menzen-mentsu-score",
  "/lessons/furo-score",
  "/lessons/fu-doubling",
  "/lessons/ron-to-tsumo",
  "/lessons/tsumo-payments",
  "/lessons/oya-ron-scores",
] as const;

/**
 * 言語ごとの公開ページ（許可リスト）
 *
 * ここに無いパスはその言語では `unpublished`。英語のページを公開するときは、
 * そのページの英語の本文・metadata が揃っていることを確かめてから足す
 * （依存する名前空間が完訳であることは `publication-gate.test.ts` が検査する）。
 *
 * 英語で公開するのは次の公開単位（どれも `published-indexable`）:
 *
 * - トップ（LP）`/`
 * - レッスンの目次 `/lessons` と 19 章（{@link EN_LESSON_PATHS}）
 * - 早見表のハブ `/reference`・役一覧 `/reference/yaku`・用語集の一覧
 *   `/reference/glossary`・点数表 `/reference/score-table`
 * - 用語のページ `/reference/glossary/[slug]`（テンプレート）
 *
 * @design 用語のページはテンプレートで持つ
 * 用語 64 件を 1 行ずつ並べると、用語を足したときに許可リストが黙って腐る。
 * かといって用語のレジストリをここで import すると、この表を読むクライアントの
 * JS（パンくず・エラー境界）にレジストリが載る。そこでテンプレートの正規表現だけを
 * 持ち、具体的なパスの列挙は `route-policy.ts` の `EN_PUBLISHED_PATHS` が
 * 用語のレジストリで展開する。テンプレートは「その語の英語の辞書が揃っていること」を
 * 保証しないが、`glossary` 名前空間は完訳でしか英語の辞書に束ねられず
 * （`translation-status.ts`）、slug の実在はページの `dynamicParams = false` と
 * 用語の静的生成が守る。
 *
 * テンプレートは slug の形（英小文字で始まる英数字とハイフン）だけを見る。形に
 * 合わないパス（`/reference/glossary/__unknown__`）は `unpublished` で、proxy が
 * 404 にする。形に合っても slug がレジストリに無いパス
 * （`/reference/glossary/unknown-term`）は、ここでは `published-indexable` を返す。
 * proxy は許可リストしか見ないのでその英語 URL を通し、ページの
 * `dynamicParams = false` が 404（noindex）にする。日本語の未知の語を proxy が
 * レジストリで弾くのは内部の `/ja` への rewrite と重なると 500 になるためで、
 * 英語の URL は rewrite しないので同じ問題は起きない（HTTP 監査の
 * `scripts/seo-audit/http.ts` が実応答の 404 を確かめる）。
 */
const TRANSLATED_PUBLICATIONS: Readonly<
  Record<TranslatedLocale, TranslatedPublicationTable>
> = {
  en: {
    paths: new Map<string, Publication>([
      ["/", "published-indexable"],
      ["/lessons", "published-indexable"],
      ...EN_LESSON_PATHS.map((path) => [path, "published-indexable"] as const),
      ["/reference", "published-indexable"],
      ["/reference/yaku", "published-indexable"],
      ["/reference/glossary", "published-indexable"],
      ["/reference/score-table", "published-indexable"],
    ]),
    templates: [
      {
        template: "/reference/glossary/[slug]",
        pattern: /^\/reference\/glossary\/[a-z][a-z0-9-]*$/,
        publication: "published-indexable",
      },
    ],
  },
};

/**
 * 既定以外の言語での公開状態を返す
 * 翻訳公開状態取得
 *
 * query・hash は落としてから判定する。完全一致の行を先に引き、無ければ
 * 動的ルートのテンプレートに当てる。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 既定以外の言語
 */
export function getTranslatedPublication(
  path: string,
  locale: TranslatedLocale,
): Publication {
  const { pathname } = splitHref(path);
  const table = TRANSLATED_PUBLICATIONS[locale];
  const exact = table.paths.get(pathname);
  if (exact !== undefined) return exact;
  return (
    table.templates.find(({ pattern }) => pattern.test(pathname))
      ?.publication ?? "unpublished"
  );
}

/**
 * その言語で公開している完全一致のパスの一覧
 *
 * 動的ルートのテンプレート（{@link translatedPublishedTemplates}）は含まない。
 * テンプレートを具体的なパスへ展開した全体の一覧は `route-policy.ts` の
 * `EN_PUBLISHED_PATHS`（展開にレジストリを読むので、このモジュールでは持たない）。
 *
 * @param locale - 既定以外の言語
 */
export function translatedPublishedPaths(
  locale: TranslatedLocale,
): readonly string[] {
  return [...TRANSLATED_PUBLICATIONS[locale].paths.keys()];
}

/**
 * その言語で公開している動的ルートのテンプレート（`/reference/glossary/[slug]`）
 *
 * @param locale - 既定以外の言語
 */
export function translatedPublishedTemplates(
  locale: TranslatedLocale,
): readonly string[] {
  return TRANSLATED_PUBLICATIONS[locale].templates.map(
    ({ template }) => template,
  );
}

/**
 * パスが合う公開テンプレートを返す（完全一致の行・どのテンプレートにも合わなければ undefined）
 * 公開テンプレート照合
 *
 * 具体的なパス（`/reference/glossary/jantou`）を、公開の単位（ルートの依存名前空間の
 * 表・page.tsx の実在）と突き合わせるときに使う。query・hash は落としてから判定する。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 既定以外の言語
 */
export function translatedTemplateOf(
  path: string,
  locale: TranslatedLocale,
): string | undefined {
  const { pathname } = splitHref(path);
  const table = TRANSLATED_PUBLICATIONS[locale];
  if (table.paths.has(pathname)) return undefined;
  return table.templates.find(({ pattern }) => pattern.test(pathname))
    ?.template;
}

/**
 * その言語のトップへの href（その言語のトップが未公開なら日本語のトップ）
 * 公開トップhref
 *
 * エラー境界・404 の「ホームへ戻る」に使う。404 から 404 へ案内しないため、
 * 未公開の言語のトップへは向けない（英語のトップ `/en` は公開しているので
 * `/en` を指す）。日本語のトップは常に公開している。
 *
 * @param locale - 今のページの言語
 */
export function publishedHomeHref(locale: SupportedLocale): string {
  if (locale === DEFAULT_LOCALE) return "/";
  return getTranslatedPublication("/", locale) === "unpublished"
    ? "/"
    : localizedHref("/", locale);
}
