import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahjong Scoring - 麻雀点数計算トレーニング",
  description:
    "麻雀の点数計算を基礎から学べるトレーニングアプリ。初心者でも符計算・点数申告をマスターできます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen overflow-x-hidden">
        <Sidebar />
        <MobileHeader />
        <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <MobileTabBar />
      </body>
    </html>
  );
}
