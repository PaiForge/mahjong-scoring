/**
 * 点数即答 説明
 *
 * @description
 * 点数即答の説明ページ。問題方式のデモを表示し、
 * チャレンジ／トレーニングの開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から点数即答を選択して遷移
 * 2. 問題方式のデモと「開始」「トレーニング」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ScoreCalculationHowToPlay } from "./_components/score-calculation-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.scoreCalculation);
}

export default function ScoreCalculationPage() {
  return (
    <PracticeIntroContent
      namespace="scoreCalculationChallenge"
      slug={PRACTICE_SLUG.scoreCalculation}
      showTraining
      howToPlay={<ScoreCalculationHowToPlay />}
    />
  );
}
