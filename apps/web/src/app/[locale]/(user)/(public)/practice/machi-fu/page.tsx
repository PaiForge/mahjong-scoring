import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { MachiFuHowToPlay } from "./_components/machi-fu-how-to-play";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/machi-fu">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/practice/machi-fu");
  return createPracticeMetadata(PRACTICE_SLUG.machiFu, { locale });
}

/**
 * 待ち符練習 説明
 *
 * @description
 * 待ち符練習の説明ページ。待ちの符計算についての概要を表示し、
 * 練習開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から待ち符を選択して遷移
 * 2. 練習の説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default async function MachiFuPage({
  params,
}: PageProps<"/[locale]/practice/machi-fu">) {
  await prepareRouteLocale(params, "/practice/machi-fu");
  return (
    <PracticeIntroContent
      namespace="machiFu"
      slug={PRACTICE_SLUG.machiFu}
      showTraining
      howToPlay={<MachiFuHowToPlay />}
    />
  );
}
