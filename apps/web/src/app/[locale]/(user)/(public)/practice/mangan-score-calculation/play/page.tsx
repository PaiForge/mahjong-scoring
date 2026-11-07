import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { Suspense } from "react";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { ManganScoreCalculationPlayView } from "../_components/mangan-score-calculation-play-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation/play">): Promise<Metadata> {
  const locale = await prepareRouteLocale(
    params,
    "/practice/mangan-score-calculation/play",
  );
  return createPracticePlayMetadata(PRACTICE_SLUG.manganScoreCalculation, {
    locale,
  });
}

/**
 * 満貫以上の点数計算 プレイ
 *
 * @description
 * 満貫以上の手牌から点数を回答する練習のプレイページ。
 * 役一覧と翻数が表示されるため、プレイヤーは翻数から点数を導出する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌・条件・役一覧が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス3回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default async function ManganScoreCalculationPlayPage({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation/play">) {
  await prepareRouteLocale(params, "/practice/mangan-score-calculation/play");
  return (
    <Suspense>
      <ManganScoreCalculationPlayView />
    </Suspense>
  );
}
