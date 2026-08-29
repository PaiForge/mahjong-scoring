import type { Metadata } from "next";

import {
  buildSocialCard,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
} from "@/app/_lib/metadata";

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
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  ...buildSocialCard({
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
};

export default function Home() {
  return <LandingPage />;
}
