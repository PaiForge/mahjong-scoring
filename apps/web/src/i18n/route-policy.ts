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
 * いま英語で公開するのは点数表（`/reference/score-table`）だけ。許可リストの
 * 実体はクライアントからも読める `translated-publications.ts` にある（理由は同
 * ファイルの TSDoc）。英語のページを足すときはそちらに 1 行足す。
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
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import {
  AGARI_SCORE_PRACTICE_HREF,
  practiceHref,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import { splitHref } from "./public-path";
import {
  getTranslatedPublication,
  translatedPublishedPaths,
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
 * 英語で公開しているパスの一覧（sitemap・監査が列挙に使う）
 *
 * 英語は許可リストなので有限に列挙できる。日本語は動的ルートを含むため
 * 列挙の関数を持たない（sitemap は `sitemap-routes.ts` を読む）。
 */
export const EN_PUBLISHED_PATHS: readonly string[] =
  translatedPublishedPaths("en");
