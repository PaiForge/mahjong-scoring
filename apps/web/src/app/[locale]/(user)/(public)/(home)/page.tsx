import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/app/[locale]/(user)/_components/json-ld";

import {
  buildAlternates,
  buildSocialCard,
  siteIdentity,
} from "@/app/_lib/metadata";
import { buildSiteSchema } from "@/app/_lib/site-schema";

import { LandingPage } from "./_components/landing-page";
import { prepareRouteLocale } from "@/i18n/route-locale";

/**
 * トップページ（LP）
 *
 * @description
 * 未ログイン訪問者向けのランディングページ。cookie を一切読まないため
 * ビルド時に静的プリレンダリングされ、遷移時はスケルトンを経由せず
 * 完成品がそのまま描画される（CLS 0）。未ログインの初回訪問は
 * Core Web Vitals の計測対象なので、この静的性を壊さないこと
 * （`getOptionalUser()` 等の cookie 読み取りをこのページに戻さない）。
 *
 * ログイン済みユーザーの「/」は proxy.ts が `/dashboard` へ rewrite するため、
 * このページには到達しない。認証分岐をページ内ではなくルーティング層で行うのは、
 * ページ内で分岐すると「/」全体が動的になり、cookie を読めない 1 枚の
 * loading.tsx で LP とダッシュボードという別形の 2 ページを受けることになる
 * （どちらに寄せてももう一方のスケルトンが必ずずれる）ため。
 *
 * タイトルと説明はルートレイアウトから継承する。ここで持つのは canonical と
 * og:url 入りのカード（レイアウト側のカードは og:url を持たないため、
 * トップページの URL はここで名乗る）。
 *
 * Organization / WebSite の JSON-LD はトップだけが出す（サイト名とロゴの根拠。
 * 各ページのパンくず・用語・記事のスキーマとは別物）。運営者名は辞書から引くため
 * async だが、cookie もデータも読まないので静的生成のまま。
 *
 * route group `(home)` は、LP（`/`）の loading.tsx を他の公開ルート（`contact` / `practice` 等）の祖先にせずに置くための
 * もの。いまは静的ルートなので loading.tsx を外してあり（静的ルートは境界を持たない。不変条件と
 * 理由は `apps/web/src/app/loading-boundaries.test.ts`）、group だけが残っている。再び動的にする
 * ときは loading.tsx をこの group に置く。page.tsx を 1 つ上に移すと、そのときに兄弟を巻き込む。
 */

/**
 * トップページの canonical・hreflang・og:url 入りのカード
 *
 * @design alternates は `buildAlternates` から組む（手書きの `{ canonical: "/" }` にしない）
 * 他の索引対象ページと同じく、HTML の hreflang（`ja` + `x-default`）を公開状態
 * （`route-policy.ts`）から組み、sitemap の `/` の alternate と一致させる。以前は
 * canonical だけを手書きしていたため、`/` だけ HTML に hreflang が無く sitemap と
 * 食い違っていた。日本語の canonical は `buildAlternates("/", "ja")` でも `/` のまま。
 *
 * 静的生成を保つため cookie / headers を読まない。言語は `params`（親の言語
 * レイアウトの `generateStaticParams` が列挙）から `prepareRouteLocale` で確定させ、
 * 確定した言語を metadata のヘルパーに明示で渡す。英語の `/`（`/en`）では
 * タイトル・説明・カード・canonical・hreflang が英語の値で組まれる。英語で
 * 未公開の間は `prepareRouteLocale` がここで 404 にする。
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/");
  const identity = siteIdentity(locale);
  return {
    alternates: buildAlternates("/", locale),
    ...buildSocialCard({
      title: identity.defaultTitle,
      description: identity.description,
      path: "/",
      locale,
    }),
  };
}

/**
 * トップページの本文と Organization / WebSite の JSON-LD
 *
 * JSON-LD にもページの言語を渡す（説明と `inLanguage` がページの言語になる。
 * `@id`・`url`・サイト名は言語で変えない — 理由は `site-schema.ts`）。本文の
 * 各 CTA も同じ言語で張る先を決める（`LandingPage`）。
 */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = await prepareRouteLocale(params, "/");
  const tCompany = await getTranslations("company");

  return (
    <>
      <JsonLd data={buildSiteSchema(tCompany("name.value"), locale)} />
      <LandingPage locale={locale} />
    </>
  );
}
