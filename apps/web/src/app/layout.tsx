import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "@/app/_contexts/auth-context";
import {
  buildSocialCard,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
} from "@/app/_lib/metadata";
import { SITE_URL } from "@/config";
import "./globals.css";

const GlobalToaster = dynamic(() =>
  import("@/app/_components/global-toaster").then((mod) => mod.GlobalToaster),
);

export const metadata: Metadata = {
  // 各ページの alternates.canonical と OGP の相対パスを絶対 URL へ解決する基準。
  // これが無いと canonical が出力されず、プレビュードメインと重複評価される。
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
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
        <NextIntlClientProvider>
          <AuthProvider>{children}</AuthProvider>
          <GlobalToaster />
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
