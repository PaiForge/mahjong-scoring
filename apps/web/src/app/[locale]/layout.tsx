import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnvironmentRibbon } from "env-ribbon";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GlobalToaster } from "@/app/_components/global-toaster";
import { GoogleAnalytics } from "@/app/_components/google-analytics";
import { AppVersionWatcher } from "@/app/_components/app-version-watcher";
import { ScrollReset } from "@/app/_components/scroll-reset";
import { AuthProvider } from "@/app/_contexts/auth-context";
import { AppTileImageProvider } from "@/app/_contexts/tile-image-context";
import {
  buildSocialCard,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/app/_lib/metadata";
import { SITE_URL } from "@/config";
import { selectClientMessages } from "@/i18n/client-messages";
import { loadMessages } from "@/i18n/request";
import { routing } from "@/i18n/routing";
import {
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import "../globals.css";

/** 対応する言語ごとに静的生成する（`/ja/...` は内部 URL、`/en/...` は公開 URL） */
export function generateStaticParams(): { locale: SupportedLocale }[] {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ readonly locale: string }>;
}

/**
 * 日本語のルートの既定 metadata（旧ルートレイアウトの値をそのまま持つ）
 *
 * 日本語の出力を移行前と同じに保つため、組み立て方を変えない。
 */
const JA_ROOT_METADATA: Metadata = {
  // 各ページの alternates.canonical と OGP の相対パスを絶対 URL へ解決する基準。
  // これが無いと canonical が出力されず、プレビュードメインと重複評価される。
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  // 既定は index, follow（明示しなくても同じ）。max-image-preview:large が無いと
  // Discover と画像付きの検索結果に大きな画像で出ない。noindex を持つページは
  // 自分の robots でこのオブジェクトごと置き換えるため影響しない。
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // metadata を持たないページ（banned 等）へのフォールバック。
  // og:url はここに書かない — 書くと canonical を持たないページまで
  // トップページの URL を名乗ってしまう。トップの og:url は
  // (home)/page.tsx が自分で持つ。
  ...buildSocialCard({ title: DEFAULT_TITLE, description: SITE_DESCRIPTION }),
};

/**
 * 英語のルートの既定 metadata
 *
 * タイトル・説明は英語の辞書（`metadata` 名前空間）から組む。OGP / Twitter Card の
 * 既定は持たない — `buildSocialCard` は日本語の版（`og:locale` が ja_JP・画像の
 * alt が日本語）を組むので、英語の既定に流用すると英語のページが日本語の
 * カードを名乗る。英語で公開するページは自分の metadata（`locale` を渡した
 * metadata ヘルパー）でカードを持つ。
 */
async function buildEnglishRootMetadata(): Promise<Metadata> {
  const { metadata } = await loadMessages("en");
  return {
    metadataBase: new URL(SITE_URL),
    title: `${metadata.siteName} - ${metadata.siteTagline}`,
    description: metadata.siteDescription,
    authors: [{ name: metadata.siteName }],
    robots: JA_ROOT_METADATA.robots,
  };
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return locale === "en" ? buildEnglishRootMetadata() : JA_ROOT_METADATA;
}

/**
 * 言語レイアウト（ユーザー向けの全ページのルートレイアウト）
 *
 * @description
 * `<html lang>`・`<body>`・グローバル CSS・Provider（辞書・牌画像・認証）・
 * トースト・解析タグ・環境リボンを持つ。管理画面（`admin/layout.tsx`）は
 * 別のルートレイアウトで、ここを通らない。API・認証コールバックも
 * `app/[locale]` の外にある。
 *
 * @design 言語は URL のセグメントから決め、headers / cookies を読まない
 * 言語ごとに HTML を静的生成し、`lang` と本文を初期 HTML に載せるため。
 * 全体を包む共通のルートで `getLocale()`（headers 読み）を呼んで言語を決める
 * 案は、全ページが動的レンダリングになり静的生成を失うため採らない。
 * ここで `setRequestLocale` を呼ぶのは、レイアウトとページが独立に評価されるため
 * （ページは各 `page.tsx` が `prepareRouteLocale` で、`(user)/layout.tsx` は自分で
 * 確定させる）。翻訳を引く前に確定させないと next-intl が headers を読みに行き、
 * そのルートが動的になる（静的ページの初期本文が空になる・LCP が落ちる）。
 *
 * @design ローディング境界を置かない
 * ここに `loading.tsx` を置くと全ページの祖先になり、静的ページの初期 HTML が
 * スケルトンだけになる（`loading-boundaries.test.ts`）。
 *
 * @design `dynamicParams = false` を付けない
 * Next 16 の `dynamicParams = false` はそのセグメントだけでなくルート全体の
 * params を閉じる（`next/dist/build/static-paths/app.js` が全セグメントの
 * 設定の論理積を取り、`build/index.js` は「ルートのタプル全体を閉じる」として
 * 全 params を not-found 扱いにする）。ここで付けると、`generateStaticParams` で
 * 列挙しない DB 由来の値（`/u/<username>`・`/announcements/<slug>`・
 * `/leaderboard/<period>/<module>`）がすべて 404 になる。対応しない言語は
 * 下の検証が 404 にし、外部からの `/<未対応の言語>/...` は proxy が日本語の
 * パスとして扱う（存在しないので 404）。
 */

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await loadMessages(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale}>
      <body className="min-h-screen overflow-x-hidden">
        <ScrollReset />
        <AppVersionWatcher />
        {/* 辞書はリクエストの言語の 1 つだけ、クライアントが引く名前空間だけ渡す。
            渡したものは全ページの HTML と遷移ごとの RSC 応答に載るため
            （`i18n/client-messages.ts`）。サーバーコンポーネントの
            getTranslations() は request.ts の同じ言語の全辞書を読む */}
        <NextIntlClientProvider
          locale={locale}
          messages={selectClientMessages(messages)}
        >
          <AppTileImageProvider>
            <AuthProvider>{children}</AuthProvider>
          </AppTileImageProvider>
          <GlobalToaster />
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <EnvironmentRibbon />
      </body>
    </html>
  );
}
