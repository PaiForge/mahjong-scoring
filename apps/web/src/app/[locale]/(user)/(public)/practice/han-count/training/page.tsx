/**
 * 翻数即答練習 トレーニング
 *
 * @description
 * 翻数即答練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 翻数を入力して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { HanCountTrainingView } from "../_components/han-count-training-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/han-count/training">): Promise<Metadata> {
  const locale = await prepareRouteLocale(
    params,
    "/practice/han-count/training",
  );
  return createPracticeTrainingMetadata(PRACTICE_SLUG.hanCount, { locale });
}

export default async function HanCountTrainingPage({
  params,
}: PageProps<"/[locale]/practice/han-count/training">) {
  await prepareRouteLocale(params, "/practice/han-count/training");
  return <HanCountTrainingView />;
}
