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
 * 目次に載る 20 章すべて。はじめに（`about-this-app`）はアプリの使い方
 * （練習・チャレンジ・道場の画面の紹介）の章で、紹介する画面が英語で未公開の
 * 間は外していた。練習・昇級試験・道場を英語で出すのと一緒に公開した
 * （本文から練習へのリンクは英語の練習を指す）。
 *
 * 章の確認問題・完了も英語で出す（ログインが要る部分は、英語で公開している
 * ログイン・登録の画面へ案内する）。
 *
 * クライアントからも読む表なので、カリキュラムのレジストリを import せず
 * 文字列で持つ。レジストリとの食い違い（章の改名・追加）は
 * `translated-publications.test.ts` が落とす。
 */
const EN_LESSON_PATHS = [
  "/lessons/about-this-app",
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
 * 英語で公開するチャレンジ型の練習（昇級試験を含む）の説明ページ
 *
 * 練習のレジストリ（`PRACTICE_MENU_REGISTRY`）の 17 件の `practiceHref(slug)` と
 * 同じ並び。練習 11 種は `/practice/<slug>`、昇級試験 6 種はレジストリの
 * `basePath`（`/exam/<級>`）。この表はクライアントからも読むので、レジストリを
 * import せず文字列で持つ（レジストリは練習の生成・判定まで引き込む）。
 * レジストリとの食い違い（練習の追加・改名・`basePath` の変更）は
 * `translated-publications.test.ts` が落とす。
 *
 * 説明ページは索引させ、配下の play / training / result は索引させない
 * （{@link PRACTICE_SUBPAGES}）。日本語と同じ分類。
 */
const EN_PRACTICE_MENU_PATHS = [
  "/practice/jantou-fu",
  "/practice/machi-fu",
  "/practice/mentsu-fu",
  "/practice/mentsu-jantou-fu",
  "/practice/total-fu",
  "/practice/yaku",
  "/practice/score-table",
  "/practice/score-calculation",
  "/practice/han-count",
  "/practice/yaku-han",
  "/practice/mangan-score-calculation",
  "/exam/mangan",
  "/exam/fu",
  "/exam/chiitoitsu",
  "/exam/pinfu",
  "/exam/fu-score",
  "/exam/score",
] as const;

/** チャレンジ型の練習の、説明ページ配下の画面（どれも閲覧者ごとの内容で noindex） */
const PRACTICE_SUBPAGES = ["play", "training", "result"] as const;

/**
 * 英語で公開する、終わりの無い練習（和了形・聴牌形の点数計算）の設定ページ
 *
 * 設定ページは索引させ、`/play` は索引させない（日本語と同じ分類）。
 */
const EN_ENDLESS_PRACTICE_PATHS = [
  "/practice/agari-score",
  "/practice/tenpai-score",
] as const;

/**
 * 英語で出すが索引させない会員の画面（認証・ダッシュボード・マイページ・設定）
 *
 * どれも閲覧者ごとの内容（ログイン状態・本人の記録・端末の設定）で動的のまま
 * 出し、英語では `robotsForPublication(path, locale)` が noindex を付ける。
 * 日本語の robots（認証・設定は meta 無し、マイページは `createPrivateMetadata` の
 * noindex）は変えない — 日本語の認証ページに meta noindex を足すのは既存の
 * 出力の変更になる。英語のマイページは robots.txt でも除外する（`app/robots.ts`）。
 */
const EN_MEMBER_PATHS = [
  // 認証フロー・BAN 通知
  "/sign-in",
  "/sign-up",
  "/sign-up/verify-email",
  "/forgot-password",
  "/reset-password",
  "/banned",
  // ログイン済みトップの実体（ログイン済みの `/en` を proxy がここへ rewrite する）
  "/dashboard",
  // マイページ（要ログイン）
  "/mypage",
  "/mypage/account",
  "/mypage/account/delete",
  "/mypage/challenges",
  "/mypage/challenges/results",
  "/mypage/notifications",
  "/mypage/plan",
  "/mypage/profile/edit",
  "/mypage/setup-username",
  // 個人設定
  "/preferences",
  "/preferences/yaku-order",
] as const;

/**
 * 言語ごとの公開ページ（許可リスト）
 *
 * ここに無いパスはその言語では `unpublished`。英語のページを公開するときは、
 * そのページの英語の本文・metadata が揃っていることを確かめてから足す
 * （依存する名前空間が完訳であることは `publication-gate.test.ts` が検査する）。
 *
 * 英語で公開するのは次の公開単位。
 *
 * `published-indexable`（静的生成・sitemap・hreflang の対象）:
 *
 * - トップ（LP）`/`
 * - レッスンの目次 `/lessons` と 20 章（{@link EN_LESSON_PATHS}。はじめにを含む）
 * - 早見表のハブ `/reference`・役一覧 `/reference/yaku`・用語集の一覧
 *   `/reference/glossary`・点数表 `/reference/score-table`
 * - 用語のページ `/reference/glossary/[slug]`（テンプレート）
 * - 練習の一覧 `/practice`、練習 11 種と昇級試験 6 種の説明ページ
 *   （{@link EN_PRACTICE_MENU_PATHS}）、和了形・聴牌形の設定ページ
 *   （{@link EN_ENDLESS_PRACTICE_PATHS}）
 * - はじめ方 `/getting-started`、体験 `/try/agari-score`・`/try/mentsu-fu`、
 *   点数計算のデモ `/reference/demo`
 *
 * `published-noindex`（出すが sitemap・hreflang に載せない）:
 *
 * - 練習・昇級試験の play / training / result（{@link PRACTICE_SUBPAGES}）と、
 *   和了形・聴牌形の `/play`
 * - 道場 `/dojo` と段級位の詳細 `/dojo/ranks/[slug]`（テンプレート）
 * - 会員の画面 18 ページ（{@link EN_MEMBER_PATHS}）: 認証（ログイン・登録・
 *   メール確認待ち・パスワードの再設定・BAN 通知）・ダッシュボード・マイページ・設定
 *
 * @design 索引させるのは「日本語で索引対象かつ静的」なページだけ
 * 英語の索引対象は、クローラーが見る初期 HTML を静的生成で返すのが規約。道場の
 * 2 ページは日本語では索引対象だが、cookie を読み閲覧者の段級位・完了で中身が
 * 変わる動的ページで、この規約に合わない。`/lessons` のように公共部分だけを
 * 静的にして本人の状態をクライアントで後付けする案は、道場の中身の大半が閲覧者に
 * 依るため見合わない。そこで道場は英語では noindex で出し、英語の検索の受け皿は
 * 練習の説明ページが担う。play / training / result は日本語でも noindex で、
 * 閲覧者ごとの内容（多くは動的）なので英語も noindex（静的である必要は無い）。
 *
 * @design 会員の画面は英語で出すが索引させない
 * 練習と試験はゲストが登録なしで回せる学習の輪で、先にここまでを英語にした。
 * 続いて会員の画面（認証・レッスンの確認問題と完了・ダッシュボード・マイページ・
 * 設定）を英語にした。機能の画面は検索流入の受け皿ではないので、すべて
 * `published-noindex`（動的のまま。sitemap・hreflang に載せない）。英語の noindex は
 * `robotsForPublication(path, locale)` で付け、日本語の robots は変えない。
 *
 * @design ランキング・公開プロフィール・お知らせ・料金・問い合わせ・規約は英語で出さない
 * ランキングと公開プロフィールは他の利用者の自由入力を見せる画面で、英語では
 * 提供しない。お知らせ・料金・問い合わせ・規約類は英語の本文を持たない。
 * 英語のページから未公開の画面への導線は「日本語のみ」の印付きで日本語の
 * ページへ送る（`(user)/_components/_lib/locale-nav-target.ts`）。
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
 *
 * 段級位の詳細 `/dojo/ranks/[slug]` も同じ理由でテンプレートで持つ（段級位の
 * レジストリはクライアントに載せない。展開は `route-policy.ts` が `RANK_SLUGS` で
 * 行う）。形に合わない slug は proxy の 404、形に合うが無い段級位はページの 404。
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
      ["/practice", "published-indexable"],
      ...EN_PRACTICE_MENU_PATHS.map(
        (path) => [path, "published-indexable"] as const,
      ),
      ...EN_ENDLESS_PRACTICE_PATHS.map(
        (path) => [path, "published-indexable"] as const,
      ),
      ["/getting-started", "published-indexable"],
      ["/try/agari-score", "published-indexable"],
      ["/try/mentsu-fu", "published-indexable"],
      ["/reference/demo", "published-indexable"],
      ...EN_PRACTICE_MENU_PATHS.flatMap((path) =>
        PRACTICE_SUBPAGES.map(
          (subpage) => [`${path}/${subpage}`, "published-noindex"] as const,
        ),
      ),
      ...EN_ENDLESS_PRACTICE_PATHS.map(
        (path) => [`${path}/play`, "published-noindex"] as const,
      ),
      ["/dojo", "published-noindex"],
      ...EN_MEMBER_PATHS.map((path) => [path, "published-noindex"] as const),
    ]),
    templates: [
      {
        template: "/reference/glossary/[slug]",
        pattern: /^\/reference\/glossary\/[a-z][a-z0-9-]*$/,
        publication: "published-indexable",
      },
      {
        template: "/dojo/ranks/[slug]",
        pattern: /^\/dojo\/ranks\/[a-z][a-z0-9-]*$/,
        publication: "published-noindex",
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
