/**
 * 点数表早引き練習 説明
 *
 * @description
 * 点数表早引き練習の説明ページ。問題方式のデモを表示し、
 * チャレンジ／トレーニングの開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から点数表早引きを選択して遷移
 * 2. 問題方式のデモと「開始」「トレーニング」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ScoreTableHowToPlay } from "./_components/score-table-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function ScoreTablePage() {
  return (
    <PracticeIntroContent
      namespace="scoreTableChallenge"
      slug="score-table"
      showLearnLink={false}
      showTraining
      howToPlay={<ScoreTableHowToPlay />}
    />
  );
}
