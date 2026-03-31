import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Sidebar } from "@/app/_components/sidebar";
import { MobileHeader } from "@/app/_components/mobile-header";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";
import { Footer } from "@/app/_components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahjong Scoring - 麻雀点数計算トレーニング",
  description:
    "麻雀の点数計算を基礎から学べるトレーニングアプリ。初心者でも符計算・点数申告をマスターできます。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale}>
      <body className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <Sidebar />
          <MobileHeader />
          <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
            {children}
          </main>
          <Footer />
          <MobileTabBar />
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
