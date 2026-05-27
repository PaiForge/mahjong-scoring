"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global Error
 *
 * RootLayout 自体が落ちた際の最終フォールバック。
 * NextIntlClientProvider や Tailwind が機能しない可能性があるため、
 * <html>/<body> から自前で記述し、スタイルはインラインで持つ。
 */
export default function GlobalError({
  error,
}: {
  readonly error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

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
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            問題が発生しました
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#475569", margin: "0 0 2rem" }}>
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.5rem",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 700,
            }}
          >
            ホームへ戻る
          </Link>
        </div>
      </body>
    </html>
  );
}
