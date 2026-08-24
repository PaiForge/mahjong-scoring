import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "@/app/_contexts/auth-context";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
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
  title: `${SITE_NAME} - ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  // トップページは createMetadata を通らないため、ここで既定の OGP を持つ。
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    url: "/",
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
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
