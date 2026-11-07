import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { MentsuFuHowToPlay } from "./_components/mentsu-fu-how-to-play";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mentsu-fu">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/mentsu-fu");
  return createPracticeMetadata(PRACTICE_SLUG.mentsuFu);
}

/**
 * 面子符練習 説明
 *
 * @description
 * 面子符練習の説明ページ。面子の符計算についての概要を表示し、
 * 練習開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から面子符を選択して遷移
 * 2. 練習の説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default async function MentsuFuPage({
  params,
}: PageProps<"/[locale]/practice/mentsu-fu">) {
  await prepareRouteLocale(params, "/practice/mentsu-fu");
  return (
    <PracticeIntroContent
      namespace="mentsuFu"
      slug={PRACTICE_SLUG.mentsuFu}
      showTraining
      howToPlay={<MentsuFuHowToPlay />}
    />
  );
}
