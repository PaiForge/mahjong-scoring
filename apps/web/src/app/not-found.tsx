import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME } from "@/app/_lib/metadata";
import { messages } from "@mahjong-scoring/messages/ja";

const { notFound } = messages;

export const metadata: Metadata = {
  title: `${notFound.title} - ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * Not Found（どのルートにも当たらない URL）
 *
 * `app/[locale]` にも `admin` にも当たらない URL の 404。ユーザー向けのページが
 * `notFound()` を呼んだときは `[locale]/not-found.tsx`（言語レイアウトの中、
 * 言語別）が出る。
 *
 * ルートレイアウトは言語ごと（`[locale]/layout.tsx`）と管理画面
 * （`admin/layout.tsx`）に分かれており、この画面を包むレイアウトは無い。
 * そのため `<html>` / `<body>` から自前で書き、言語の判定もしない
 * （判定のために headers を読むと静的に返せない）。文言は日本語の辞書の
 * `notFound` 名前空間をサーバーで読む（Provider の外なので `getTranslations`
 * は使わない。クライアントへ辞書は渡らない）。スタイルは globals.css に頼らず
 * インラインで持つ（`global-error.tsx` と同じ理由）。Next が 404 の応答に
 * noindex を入れるが、metadata でも明示する。
 */
export default function NotFound() {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <p
            style={{
              fontSize: "3.75rem",
              fontWeight: 300,
              color: "#94a3b8",
              margin: "0 0 1rem",
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 0.75rem",
            }}
          >
            {notFound.title}
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#475569",
              margin: "0 0 2rem",
            }}
          >
            {notFound.description}
          </p>
          {/* 遷移先とルートレイアウトが別なので、Next が全ページの読み込みで遷移する */}
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.5rem",
              // 主操作の色（globals.css の --color-action）
              backgroundColor: "#007a3d",
              color: "#ffffff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 700,
            }}
          >
            {notFound.goHome}
          </Link>
        </main>
      </body>
    </html>
  );
}
