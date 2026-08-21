import type { Metadata } from "next";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { TotalFuHowToPlay } from "./_components/total-fu-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("totalFu");
}

/**
 * 手牌の合計符練習 説明
 *
 * @description
 * 手牌の合計符練習の説明ページ。手牌1つにつき符を1つだけ答える出題方式を示し、
 * 練習開始および教本ページへのリンクを提供する。
 * 要素ごとに符を答える手牌符練習（tehai-fu）と対になる。
 *
 * @flow
 * 1. ユーザーが練習一覧から手牌の合計符を選択して遷移
 * 2. 出題例と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function TotalFuPage() {
  return (
    <PracticeIntroContent
      namespace="totalFu"
      slug="total-fu"
      showTraining
      learnHref="/learn/tehai-fu"
      howToPlay={<TotalFuHowToPlay />}
    />
  );
}
