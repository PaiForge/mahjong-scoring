/**
 * 満貫以上点数計算ドリル 説明
 *
 * @description
 * 満貫以上点数計算ドリルの説明ページ。問題方式のデモを表示し、
 * チャレンジ／トレーニングの開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から満貫以上点数計算を選択して遷移
 * 2. 問題方式のデモと「開始」「トレーニング」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ManganScoreCalculationHowToPlay } from "./_components/mangan-score-calculation-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("manganScoreCalculationChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function ManganScoreCalculationPage() {
  return (
    <PracticeIntroContent
      namespace="manganScoreCalculationChallenge"
      slug="mangan-score-calculation"
      showLearnLink={false}
      showTraining
      howToPlay={<ManganScoreCalculationHowToPlay />}
    />
  );
}
