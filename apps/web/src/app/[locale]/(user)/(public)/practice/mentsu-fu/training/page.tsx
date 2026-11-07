/**
 * 面子符練習 トレーニング
 *
 * @description
 * 面子符練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 回答ごとにフィードバックを挟んで次の問題へ自動で進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { MentsuFuTrainingView } from "../_components/mentsu-fu-training-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mentsu-fu/training">): Promise<Metadata> {
  const locale = await prepareRouteLocale(
    params,
    "/practice/mentsu-fu/training",
  );
  return createPracticeTrainingMetadata(PRACTICE_SLUG.mentsuFu, { locale });
}

export default async function MentsuFuTrainingPage({
  params,
}: PageProps<"/[locale]/practice/mentsu-fu/training">) {
  await prepareRouteLocale(params, "/practice/mentsu-fu/training");
  return <MentsuFuTrainingView />;
}
