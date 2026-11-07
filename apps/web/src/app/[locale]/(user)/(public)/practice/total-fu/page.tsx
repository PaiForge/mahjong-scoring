import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { TotalFuHowToPlay } from "./_components/total-fu-how-to-play";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/total-fu">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/total-fu");
  return createPracticeMetadata(PRACTICE_SLUG.totalFu);
}

/**
 * 手牌の合計符練習 説明
 *
 * @description
 * 手牌の合計符練習の説明ページ。手牌1つにつき符を1つだけ答える出題方式を示し、
 * 出題範囲（バリアント）の選択と練習開始、教本ページへのリンクを提供する。
 * 要素ごとに符を答える練習（mentsu-jantou-fu）と対になる。出題範囲
 * （40符まで / 60符まで / すべて）はレジストリの `variants` で、共通の
 * `VariantStartPanel` が選択させて play / training への `variant` クエリに反映する。
 *
 * @flow
 * 1. ユーザーが練習一覧から手牌の合計符を選択して遷移
 * 2. 出題例と出題範囲セレクタ、「開始」ボタン、教本ページへのリンクが表示される
 * 3. 範囲を選んで「開始」を押すと play ページへ遷移（variant クエリ付き）
 */
export default async function TotalFuPage({
  params,
}: PageProps<"/[locale]/practice/total-fu">) {
  await prepareRouteLocale(params, "/practice/total-fu");
  return (
    <PracticeIntroContent
      namespace="totalFu"
      slug={PRACTICE_SLUG.totalFu}
      showTraining
      howToPlay={<TotalFuHowToPlay />}
    />
  );
}
