/**
 * 雀頭符練習 トレーニング
 *
 * @description
 * 雀頭符練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。ユーザーは「終了」リンクで任意に離脱する。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 回答ごとに正誤フィードバックを挟んで次の問題へ自動で進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { JantouFuTrainingView } from "../_components/jantou-fu-training-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/jantou-fu/training">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/jantou-fu/training");
  return createPracticeTrainingMetadata(PRACTICE_SLUG.jantouFu);
}

export default async function JantouFuTrainingPage({
  params,
}: PageProps<"/[locale]/practice/jantou-fu/training">) {
  await prepareRouteLocale(params, "/practice/jantou-fu/training");
  return <JantouFuTrainingView />;
}
