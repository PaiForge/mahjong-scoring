/**
 * 翻数即答 説明
 *
 * @description
 * 翻数即答練習の説明ページ。練習の概要を表示し、
 * 練習開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から翻数即答を選択して遷移
 * 2. 練習の説明と「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { HanCountHowToPlay } from "./_components/han-count-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.hanCount);
}

export default function HanCountPage() {
  return (
    <PracticeIntroContent
      namespace="hanCountChallenge"
      slug={PRACTICE_SLUG.hanCount}
      showTraining
      howToPlay={<HanCountHowToPlay />}
    />
  );
}
