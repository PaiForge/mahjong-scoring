/**
 * 点数計算の体験
 *
 * @description はじめ方ガイド（/getting-started）の「まずは体験」の遷移先。
 * 登録なし・設定なしで、固定の 1 問（役牌の暗刻、1 翻 40 符 = 1300 点）を
 * 総合演習と同じ盤面・回答フォームで解き、答え合わせの下でアカウント登録へ
 * 誘導する。cookie を読まない静的ページ。
 *
 * 総合演習（/practice/score）ではなく専用ページなのは、総合演習の入口が設定画面で
 * 「何を体験するか」より先に出題条件の判断を求めること、そして未ログインの
 * 無料枠（1 日 1 問）を体験の 1 問で使い切ってしまうため。問題はコードに固定で
 * あり出題の許可をサーバーに聞かないので、ここで解いても無料枠は減らない。
 *
 * @flow 問題を見る → 翻・符・点数を回答（または「わからない」で正解を開示）→
 * 答え合わせ → 「無料ユーザー登録」(/sign-up) か「登録せずに練習一覧を見る」
 * (/practice)。「もう一度解く」で同じ問題を解き直せる
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { TryBoard } from "./_components/try-board";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("tryDemo", { path: "/try" });
}

export default async function TryPage() {
  const t = await getTranslations("tryDemo");

  return (
    // 練習の play 画面と同じく、スクロール先をタイトル帯ではなくカード領域
    // （盤面）に置く。開いた直後に盤面が画面最上部へ来る（TryBoard がスクロールする）
    <ContentContainer
      id={PRACTICE_SCROLL_ANCHOR_ID}
      fillViewport
      breadcrumb={[{ label: t("title") }]}
    >
      <PageTitle>{t("title")}</PageTitle>
      <TryBoard />
    </ContentContainer>
  );
}
