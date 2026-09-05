import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { MentsuJantouFuHowToPlay } from "./_components/mentsu-jantou-fu-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.mentsuJantouFu);
}

/**
 * 面子と雀頭の符計算 説明
 *
 * @description
 * 面子と雀頭の符計算の説明ページ。要素ごとに符を答える練習の概要を表示し、
 * 練習開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から面子と雀頭の符計算を選択して遷移
 * 2. 練習の説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function MentsuJantouFuPage() {
  return (
    <PracticeIntroContent
      namespace="mentsuJantouFu"
      slug={PRACTICE_SLUG.mentsuJantouFu}
      showTraining
      howToPlay={<MentsuJantouFuHowToPlay />}
    />
  );
}
