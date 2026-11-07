import type { Metadata } from "next";
import Link from "next/link";

import {
  BUTTON_CONTENT_CLASSES,
  buttonClasses,
} from "@/app/[locale]/(user)/_components/_lib/button-classes";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
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
 * 持つ。外部の URL で言語の接頭辞が無いのは日本語なので、日本語で描く。
 *
 * @design 移行前と同じ見た目・同じ導線で描く
 * 言語レイアウトを導入する前は、この 404 はルートレイアウト（globals.css）の中で
 * `ContentContainer` とボタンの見た目のリンクを使い、「ホームへ戻る」と
 * 「練習一覧へ」を出していた。古いリンクや打ち間違いで来た人を練習へ戻す
 * 導線なので、同じ見た目と 2 つのリンクを保つ。
 *
 * @design 辞書の Provider も next-intl のサーバー API も使わない
 * この 404 は全ページのツリーの中で評価される（root の not-found 境界）。ここで
 * サーバー版の `NextIntlClientProvider` を置くと、言語が確定していないので
 * next-intl が headers を読みに行き、**全ページが動的になる**（実測: 静的生成の
 * 台帳が 154 件 → 0 件）。言語を確定させる `setRequestLocale("ja")` も、英語の
 * ページの評価中に呼ばれ得るので使わない。そのため文言は日本語の辞書の
 * `notFound` 名前空間を直接読み、`useTranslations` を呼ぶ部品（`LinkButton` の
 * 遷移中の表示・パンくず）を使わない。ホームへのリンクは `LinkButton` と同じ
 * クラスの素の `Link` にする（ルートレイアウトをまたぐ遷移で文書ごと読み込む
 * ので、遷移中の表示は出る間が無い）。Next が 404 の応答に noindex を入れるが、
 * metadata でも明示する。
 */
export default function NotFound() {
  return (
    <html lang="ja">
      <body className="min-h-screen overflow-x-hidden">
        <ContentContainer>
          <div className="flex flex-col items-center text-center py-12">
            <p className="text-6xl font-light text-surface-400 mb-4">404</p>
            <PageTitle className="mb-3">{notFound.title}</PageTitle>
            <p className="text-sm text-surface-600 mb-8">
              {notFound.description}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/" className={buttonClasses()}>
                <span className={BUTTON_CONTENT_CLASSES}>
                  {notFound.goHome}
                </span>
              </Link>
              <Link
                href={PRACTICE_PATH}
                className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
              >
                {notFound.toPractice}
              </Link>
            </div>
          </div>
        </ContentContainer>
      </body>
    </html>
  );
}
