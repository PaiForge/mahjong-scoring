import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { YakuHowToPlay } from "./_components/yaku-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.yaku);
}

/**
 * 役判定練習 説明
 *
 * @description
 * 役判定練習の説明ページ。役判定についての概要を表示し、
 * 練習開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から役を選択して遷移
 * 2. 練習の説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function YakuPage() {
  return (
    <PracticeIntroContent
      namespace="yaku"
      slug={PRACTICE_SLUG.yaku}
      showTraining
      howToPlay={<YakuHowToPlay />}
    />
  );
}
