/**
 * 点数計算の体験
 *
 * @description はじめ方ガイド（/getting-started）の「まずは体験」の遷移先。
 * 登録なし・設定なしで、固定の 1 問（役牌の暗刻、1 翻 40 符 = 1300 点）を
 * 和了形の点数計算と同じ盤面・回答フォームで解き、答え合わせの下でアカウント登録へ
 * 誘導する。cookie を読まない静的ページ。
 *
 * 和了形の点数計算（/practice/agari-score）ではなく専用ページなのは、和了形の点数計算の入口が設定画面で
 * 「何を体験するか」より先に出題条件の判断を求めること、そして未ログインの
 * 無料枠（1 日 1 問）を体験の 1 問で使い切ってしまうため。問題はコードに固定で
 * あり出題の許可をサーバーに聞かないので、ここで解いても無料枠は減らない。
 *
 * @flow 問題を見る → 翻・符・点数を回答（または「わからない」で正解を開示）→
 * 答え合わせ → 「無料ユーザー登録」(/sign-up) か「登録せずに練習一覧を見る」
 * (/practice)。答え合わせのあとに出る練習のカードから各練習の説明ページへ /
 * LP へ戻る
 *
 * 登録と練習一覧の張る先はここ（サーバー）で `resolveNavTargetFor` に問い、
 * 盤面（クライアント）へ渡す。公開状態の判定はサーバー専用のため。英語では
 * 練習一覧は英語の `/en/practice`、登録は英語で未公開なので「日本語のみ」の
 * 印付きで日本語の登録へ送る。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { TryPracticeLinks } from "@/app/[locale]/(user)/(public)/_components/try-practice-links";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/[locale]/(user)/(public)/practice/_lib/scroll-anchor";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

import { TryBoard } from "./_components/try-board";
import { prepareRouteLocale } from "@/i18n/route-locale";

/** 登録ページ（ロケール非依存の href） */
const SIGN_UP_PATH = "/sign-up";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/try/agari-score">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/try/agari-score");
  return createNamespaceMetadata("tryDemo", {
    path: "/try/agari-score",
    locale,
  });
}

export default async function TryPage({
  params,
}: PageProps<"/[locale]/try/agari-score">) {
  const locale = await prepareRouteLocale(params, "/try/agari-score");
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
      <TryBoard
        signUpTarget={resolveNavTargetFor(SIGN_UP_PATH, locale)}
        browseTarget={resolveNavTargetFor(PRACTICE_PATH, locale)}
        afterAnswer={<TryPracticeLinks />}
      />
    </ContentContainer>
  );
}
