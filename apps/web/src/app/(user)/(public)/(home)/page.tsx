import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/app/(user)/_components/json-ld";

import {
  buildSocialCard,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
} from "@/app/_lib/metadata";
import { buildSiteSchema } from "@/app/_lib/site-schema";

import { LandingPage } from "./_components/landing-page";

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
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  ...buildSocialCard({
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
};

export default async function Home() {
  const tCompany = await getTranslations("company");

  return (
    <>
      <JsonLd data={buildSiteSchema(tCompany("name.value"))} />
      <LandingPage />
    </>
  );
}
