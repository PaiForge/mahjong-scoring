import type { Metadata } from "next";
import { EnvironmentRibbon } from "env-ribbon";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
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
import { IOS_APP_STORE_ID, SITE_URL } from "@/config";
import { clientMessages } from "@/i18n/client-messages";
import "./globals.css";

export const metadata: Metadata = {
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
  // iOS Safari の Smart App Banner（上端の「App Store で入手 / 開く」の帯）。
  // 表示・インストール済みの判定・閉じた後の扱いは OS が持ち、他のブラウザと
  // Android では何も出ない。全ページに出すため、ページ側で上書きしない。
  itunes: { appId: IOS_APP_STORE_ID },
  // metadata を持たないページ（banned 等）へのフォールバック。
  // og:url はここに書かない — 書くと canonical を持たないページまで
  // トップページの URL を名乗ってしまう。トップの og:url は
  // (home)/page.tsx が自分で持つ。
  ...buildSocialCard({ title: DEFAULT_TITLE, description: SITE_DESCRIPTION }),
};

export default async function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const locale = await getLocale();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale}>
      <body className="min-h-screen overflow-x-hidden">
        <ScrollReset />
        <AppVersionWatcher />
        {/* 辞書はクライアントが引く名前空間だけ渡す。渡したものは全ページの HTML と
            遷移ごとの RSC 応答に載るため（`i18n/client-messages.ts`）。
            サーバーコンポーネントの getTranslations() は request.ts の全辞書を読む */}
        <NextIntlClientProvider messages={clientMessages}>
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
