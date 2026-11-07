/**
 * 満貫以上の点数計算 説明
 *
 * @description
 * 満貫以上の点数計算の説明ページ。問題方式のデモを表示し、
 * チャレンジ／トレーニングの開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から満貫以上の点数計算を選択して遷移
 * 2. 問題方式のデモと「開始」「トレーニング」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ManganScoreCalculationHowToPlay } from "./_components/mangan-score-calculation-how-to-play";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/mangan-score-calculation");
  return createPracticeMetadata(PRACTICE_SLUG.manganScoreCalculation);
}

export default async function ManganScoreCalculationPage({
  params,
}: PageProps<"/[locale]/practice/mangan-score-calculation">) {
  await prepareRouteLocale(params, "/practice/mangan-score-calculation");
  return (
    <PracticeIntroContent
      namespace="manganScoreCalculationChallenge"
      slug={PRACTICE_SLUG.manganScoreCalculation}
      showTraining
      howToPlay={<ManganScoreCalculationHowToPlay />}
    />
  );
}
