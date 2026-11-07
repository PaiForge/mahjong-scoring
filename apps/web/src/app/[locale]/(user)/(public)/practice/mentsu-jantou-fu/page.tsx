import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { MentsuJantouFuHowToPlay } from "./_components/mentsu-jantou-fu-how-to-play";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mentsu-jantou-fu">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/mentsu-jantou-fu");
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
export default async function MentsuJantouFuPage({
  params,
}: PageProps<"/[locale]/practice/mentsu-jantou-fu">) {
  await prepareRouteLocale(params, "/practice/mentsu-jantou-fu");
  return (
    <PracticeIntroContent
      namespace="mentsuJantouFu"
      slug={PRACTICE_SLUG.mentsuJantouFu}
      showTraining
      howToPlay={<MentsuJantouFuHowToPlay />}
    />
  );
}
