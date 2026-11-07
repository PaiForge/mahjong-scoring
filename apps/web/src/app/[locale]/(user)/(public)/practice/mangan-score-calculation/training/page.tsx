/**
 * 満貫以上の点数計算 トレーニング
 *
 * @description
 * 満貫以上の点数計算のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 点数を回答して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { ManganScoreCalculationTrainingView } from "../_components/mangan-score-calculation-training-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation/training">): Promise<Metadata> {
  const locale = await prepareRouteLocale(
    params,
    "/practice/mangan-score-calculation/training",
  );
  return createPracticeTrainingMetadata(PRACTICE_SLUG.manganScoreCalculation, {
    locale,
  });
}

export default async function ManganScoreCalculationTrainingPage({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation/training">) {
  await prepareRouteLocale(
    params,
    "/practice/mangan-score-calculation/training",
  );
  return <ManganScoreCalculationTrainingView />;
}
