import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SITE_NAME } from "@/app/_lib/metadata";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";
import { messages } from "@mahjong-scoring/messages/ja";
import "./globals.css";

const { notFound } = messages;

export const metadata: Metadata = {
  title: `${notFound.title} - ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * Not Found（どのルートにも当たらない URL）
 *
 * `app/[locale]` にも `admin` にも当たらない URL（`/no-such-page` 等）の 404。
 * ユーザー向けのページが `notFound()` を呼んだときは `[locale]/not-found.tsx`
 * （言語レイアウトの中、言語別）が出る。
 *
 * ルートレイアウトは言語ごと（`[locale]/layout.tsx`）と管理画面
 * （`admin/layout.tsx`）に分かれており、この画面を包むレイアウトは素通しの
 * `app/layout.tsx` だけ。そのため `<html>` / `<body>` とグローバル CSS を自分で
 * 持ち、言語の判定はしない（判定のために headers を読むと静的に返せない）。
 * 外部の URL で言語の接頭辞が無いのは日本語なので、日本語で描く。
 *
 * @design 移行前と同じ部品・同じ導線で描く
 * 言語レイアウトを導入する前は、この 404 はルートレイアウト（globals.css と
 * Provider）の中で `ContentContainer`・`LinkButton` を使い、「ホームへ戻る」と
 * 「練習一覧へ」を出していた。古いリンクや打ち間違いで来た人を練習へ戻す
 * 導線なので、同じ見た目と 2 つのリンクを保つ。言語レイアウトの辞書の
 * Provider の外なので、見出し・説明・リンクの文言は日本語の辞書の `notFound`
 * 名前空間をサーバーで直接読む。`LinkButton` の遷移中の表示が `common` を引くので、
 * その名前空間だけを渡す Provider を置く（辞書全体はクライアントへ渡さない）。
 * Next が 404 の応答に noindex を入れるが、metadata でも明示する。
 */
export default function NotFound() {
  return (
    <html lang="ja">
      <body className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider
          locale="ja"
          messages={{ common: messages.common }}
        >
          <ContentContainer>
            <div className="flex flex-col items-center text-center py-12">
              <p className="text-6xl font-light text-surface-400 mb-4">404</p>
              <PageTitle className="mb-3">{notFound.title}</PageTitle>
              <p className="text-sm text-surface-600 mb-8">
                {notFound.description}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {/* 遷移先とルートレイアウトが別なので、Next が全ページの読み込みで遷移する */}
                <LinkButton href="/">{notFound.goHome}</LinkButton>
                <Link
                  href={PRACTICE_PATH}
                  className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
                >
                  {notFound.toPractice}
                </Link>
              </div>
            </div>
          </ContentContainer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
