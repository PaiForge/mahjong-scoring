/**
 * 言語ごとのページの公開状態
 * ルート公開ポリシー
 *
 * あるロケール非依存のパスが、ある言語で「出していないか / 出しているが
 * 索引させないか / 出して索引させるか」を 1 箇所で決める。proxy（未公開の
 * 英語を HTTP 404 にする）・ページ（`prepareRouteLocale`）・metadata と
 * sitemap の hreflang（`seo-alternates.ts`）・言語切替のリンクは、すべて
 * これを読む。置き場所ごとに判定を持つと、404 になる英語 URL を hreflang や
 * 切替リンクに出すような食い違いが起きる。
 *
 * **英語は許可リスト（allowlist）で管理する。** 載っていないパスは
 * `unpublished` で、proxy が 404 + noindex を返す。辞書（英語の翻訳）が
 * 存在するだけでは公開しない。未訳ページに日本語の本文を英語 URL で
 * 200 として返す（ja fallback）・日本語へ自動で 302 する・英語の LP へ
 * 一律に転送する、のいずれも採らない — 中身の薄い・日本語と重複した英語 URL が
 * 索引され、未完成のページへ内部リンクが張られるため。
 * 「すべて英語で出してから noindex にする」既定も持たない。
 * 英語で公開するのは、索引させるページとしてトップ（LP）・レッスンの目次と
 * 20 章・早見表のハブ・役一覧・用語集（一覧と全用語）・点数表・点数計算のデモ・
 * 練習の一覧と練習 / 昇級試験の説明ページ・和了形と聴牌形の設定・はじめ方・体験・
 * 法務と運営情報（利用規約・プライバシーポリシー・特商法の表記・運営者情報）・
 * お問い合わせの入力・料金、索引させないページとして練習 / 昇級試験の play・
 * training・result、和了形と聴牌形の play、道場と段級位の詳細、会員の画面
 * （認証・ダッシュボード・マイページ・設定の 18 ページ）、お問い合わせの確認・完了、
 * お知らせの一覧と詳細（英語で書いた行だけ。日本語へ fallback しない）。
 * 許可リストの実体はクライアントからも読める
 * `translated-publications.ts` にある（理由と公開単位の一覧は同ファイルの TSDoc）。
 * 英語のページを足すときはそちらに 1 行足す。動的ルートのテンプレート（用語の
 * ページ・段級位の詳細・お知らせの詳細）は同ファイルが形だけで判定し、具体的な
 * パスの列挙は下の {@link EN_PUBLISHED_PATHS} がレジストリで展開する（DB 由来の
 * お知らせは展開しない）。
 *
 * **日本語は既存の分類をそのまま取り込む。** sitemap に載るページ
 * （`sitemap-routes.ts`）が `published-indexable`、それ以外の実在するページ
 * （noindex 指定・認証フロー・マイページ・プレイ画面など）が
 * `published-noindex`。日本語の URL の集合と分類はこのモジュールでは変えない。
 * `route-policy.test.ts` が `app/[locale]/(user)` の全 page.tsx を走査し、
 * 分類の無いページ・実在しない分類・sitemap との食い違いを落とす。
 * 日本語のページを足したら、sitemap に載せるか、下の
 * `JA_NOINDEX_PATHS` / `JA_NOINDEX_PATTERNS` に足す。
 *
 * 管理画面・API など `app/[locale]` の外にあるパスは、どの言語でも
 * `unpublished`（ロケール付きの公開ページではない）。
 *
 * 翻訳の作業状況（どの名前空間が訳し終わったか）は別の責務で、ここでは
 * 持たない。英語を公開に切り替えるのは、そのページの翻訳が揃ったことを
 * 確かめてからここに 1 行足す。
 */

import {
  GLOSSARY_SITEMAP_PATHS,
  INDEXABLE_PATHS,
  RANK_SITEMAP_PATHS,
} from "@/app/_lib/sitemap-routes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";
import { glossaryTermHref } from "@mahjong-scoring/features/glossary/routes";
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import { RANK_SLUGS } from "@mahjong-scoring/features/ranks/registry";
import {
  AGARI_SCORE_PRACTICE_HREF,
  practiceHref,
  rankHref,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import { splitHref } from "./public-path";
import {
  getTranslatedPublication,
  translatedPublishedPaths,
  translatedPublishedTemplates,
  type Publication,
} from "./translated-publications";

export type { Publication } from "./translated-publications";

/** 日本語で索引させるページ（sitemap に載るページ。DB 由来のお知らせ詳細を除く） */
const JA_INDEXABLE_PATHS: ReadonlySet<string> = new Set([
  ...INDEXABLE_PATHS,
  ...GLOSSARY_SITEMAP_PATHS,
  ...RANK_SITEMAP_PATHS,
]);

/**
 * 日本語で索引させる動的ページ
 *
 * お知らせ詳細は DB 由来で、sitemap が公開済みの slug を実行時に引く。
 * 存在しない slug はページが 404 にする。
 */
const JA_INDEXABLE_PATTERNS: readonly RegExp[] = [/^\/announcements\/[^/]+$/];

/** チャレンジ型の練習（昇級試験を含む）の、説明ページ配下の画面 */
const PRACTICE_SUBPAGE_PATHS: readonly string[] = PRACTICE_MENU_SLUGS.flatMap(
  (slug) =>
    ["play", "result", "training"].map(
      (subpage) => `${practiceHref(slug)}/${subpage}`,
    ),
);

/**
 * 日本語で出しているが索引させないページ
 *
 * sitemap に載らない実在のページ。プレイ・結果・トレーニングは noindex、
 * マイページは要ログインで robots 除外、認証フローと個人設定は検索流入の
 * 受け皿にしない。
 */
const JA_NOINDEX_PATHS: ReadonlySet<string> = new Set([
  ...PRACTICE_SUBPAGE_PATHS,
  `${AGARI_SCORE_PRACTICE_HREF}/play`,
  `${TENPAI_SCORE_PRACTICE_HREF}/play`,
  // ログイン済みトップの実体（外部 URL は「/」のまま）
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
  // 認証フロー
  "/sign-in",
  "/sign-up",
  "/sign-up/verify-email",
  "/forgot-password",
  "/reset-password",
  // お問い合わせの確認・完了（入力ページは sitemap に載る）
  "/contact/confirm",
  "/contact/success",
  // 個人設定
  "/preferences",
  "/preferences/yaku-order",
  // BAN 通知
  "/banned",
]);

/**
 * 日本語で出しているが索引させない動的ページ
 *
 * ランキングの詳細（期間 × 練習）と公開プロフィール（robots で除外）。
 * 存在しない値はページが 404 にする。
 */
const JA_NOINDEX_PATTERNS: readonly RegExp[] = [
  /^\/leaderboard\/[^/]+\/[^/]+$/,
  /^\/u\/[^/]+$/,
];

function classifyJapanese(path: string): Publication {
  if (JA_INDEXABLE_PATHS.has(path)) return "published-indexable";
  if (JA_INDEXABLE_PATTERNS.some((pattern) => pattern.test(path))) {
    return "published-indexable";
  }
  if (JA_NOINDEX_PATHS.has(path)) return "published-noindex";
  if (JA_NOINDEX_PATTERNS.some((pattern) => pattern.test(path))) {
    return "published-noindex";
  }
  return "unpublished";
}

/**
 * ロケール非依存のパスの、ある言語での公開状態を返す
 * 公開状態取得
 *
 * 動的ルートは具体的なパス（`/reference/glossary/<slug>`）で渡す。
 * 日本語の動的ルートのうち、値がレジストリにあるもの（用語・段級位）は
 * レジストリの値だけが公開。DB 由来のもの（お知らせ・プロフィール・
 * ランキング詳細）は形だけで判定し、値の実在はページが確かめる。
 *
 * 契約上 `path` は query・hash を含まないが、含んでいれば落としてから判定する
 * （`?variant=` の違いで公開状態が変わらないように）。
 *
 * @param path - ロケール非依存のパス（`/reference/score-table` 等）
 * @param locale - 判定する言語
 */
export function getPublication(
  path: string,
  locale: SupportedLocale,
): Publication {
  const { pathname } = splitHref(path);
  if (locale !== DEFAULT_LOCALE) {
    return getTranslatedPublication(pathname, locale);
  }
  return classifyJapanese(pathname);
}

/** 公開状態が「出している」（`unpublished` 以外）か */
export function isPublished(publication: Publication): boolean {
  return publication !== "unpublished";
}

/**
 * 公開テンプレートを具体的なパスへ展開する表
 *
 * 許可リストのテンプレート（`translated-publications.ts`）は形だけを持つ。
 * sitemap・言語切替の表・監査は具体的なパスを要るので、ここでレジストリの値へ
 * 展開する。テンプレートを許可リストに足したらここにも足す（キーが無いと
 * `route-policy.test.ts` が落とす。書き忘れたテンプレートが黙って列挙から漏れる
 * のを防ぐため）。展開しないと決めたテンプレートは空配列で登録する。テストが
 * 「キーがあるか」を見るために export している（アプリのコードは
 * {@link EN_PUBLISHED_PATHS} を読む）。
 *
 * @design お知らせの詳細は空配列（DB 由来で静的に列挙できない）
 * `/announcements/[slug]` の slug は DB の行で、レジストリのようにビルド時の
 * 定数として列挙できない。英語のお知らせは noindex（動的のまま）なので sitemap・
 * 言語切替の表に載せる必要が無く、空でよい。英語のお知らせを索引させるときは、
 * sitemap が DB から言語ごとに公開 slug を引く別の仕組み（と詳細の静的化）が要る。
 */
export const TEMPLATE_EXPANSIONS: Readonly<Record<string, readonly string[]>> =
  {
    "/reference/glossary/[slug]": GLOSSARY_TERM_SLUGS.map(glossaryTermHref),
    "/dojo/ranks/[slug]": RANK_SLUGS.map(rankHref),
    "/announcements/[slug]": [],
  };

/**
 * 英語で公開しているパスの一覧（sitemap・言語切替の表・監査が列挙に使う）
 *
 * 許可リストの完全一致の行と、動的ルートのテンプレートを
 * {@link TEMPLATE_EXPANSIONS} で展開した具体的なパス（用語 64 件・段級位 6 件。
 * お知らせの詳細は展開しないので含まない）。
 * `published-noindex` のページも含む（索引させるかは {@link getPublication} で
 * 引く。sitemap は `published-indexable` だけを載せる）。並びは
 * 完全一致の行（許可リストの順）→ テンプレートの展開（レジストリの順）。
 * 英語は許可リストなので有限に列挙できる。日本語は動的ルートを含むため
 * 列挙の関数を持たない（sitemap は `sitemap-routes.ts` を読む）。
 */
export const EN_PUBLISHED_PATHS: readonly string[] = [
  ...translatedPublishedPaths("en"),
  ...translatedPublishedTemplates("en").flatMap(
    (template) => TEMPLATE_EXPANSIONS[template] ?? [],
  ),
];
