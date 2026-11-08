import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * web の URL とロケールの対応（next-intl のルーティング設定）
 * ロケールルーティング
 *
 * 公開 URL は「日本語は接頭辞なし（`/practice`）、英語は `/en` 接頭辞
 * （`/en/reference/score-table`）」。slug は言語で変えない。既存の日本語 URL
 * には被リンク・索引・canonical が積み上がっているため、日本語の URL を
 * 1 本も動かさずに英語を足せる `as-needed` を採る（`always` にすると全日本語
 * URL が `/ja/...` へ移り、移転のリダイレクトと評価の引き継ぎが要る）。
 *
 * 言語は URL だけで決める。次の 3 つを切っている:
 *
 * - `localeDetection: false` — `Accept-Language` と cookie から言語を推測して
 *   リダイレクトしない。同じ URL が閲覧者ごとに別の言語や別の Location を
 *   返すと、クローラーの見る内容と利用者の見る内容が食い違い、日本語 URL の
 *   索引が英語の内容で上書きされる恐れがある
 * - `localeCookie: false` — `NEXT_LOCALE` を書かない。言語を覚える仕組みは
 *   当面、言語切替のリンク（URL）だけに持たせる。cookie を書くと
 *   `Set-Cookie` 付きの応答になり、LP の静的配信も崩れる
 * - `alternateLinks: false` — next-intl が全ページへ自動で付ける `Link`
 *   ヘッダの hreflang を止める。next-intl は翻訳の有無を知らず、未訳で 404 に
 *   なる `/en/...` まで相互の alternate として列挙してしまう。hreflang は
 *   公開状態（`route-policy.ts`）から組む `seo-alternates.ts` に一本化する
 *
 * 内部の URL は `/<locale>/...`（`app/[locale]/...`）で、外部の日本語 URL は
 * proxy が `/ja/...` へ内部 rewrite する。外部から来た `/ja/...` は接頭辞なしの
 * 日本語 URL へ正規化するだけで、`/ja/...` をリンク・sitemap・canonical に
 * 出さない（`localizedHref` は日本語を恒等で返す）。
 */
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});
