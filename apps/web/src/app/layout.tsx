import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahjong Scoring",
  description: "麻雀の点数計算を学習するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
