/**
 * 役の翻数 説明
 *
 * @description
 * 役翻数練習の説明ページ。役名と門前/鳴きの状態から翻数を答える練習の
 * 概要（問題方式デモ）を表示し、出題範囲（バリアント）の選択と練習開始
 * ボタンを提供する。出題範囲（食い下がりなし / 食い下がりあり / すべて）は
 * レジストリの `variants` で、共通の `VariantStartPanel` が選択させて
 * play / training への `variant` クエリに反映する。
 *
 * @flow
 * 1. ユーザーが練習一覧から役の翻数を選択して遷移
 * 2. 問題方式デモと出題範囲セレクタ、「開始」「トレーニング」ボタンが表示される
 * 3. 範囲を選んで「開始」を押すと play ページへ遷移（variant クエリ付き）
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { YakuHanHowToPlay } from "./_components/yaku-han-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.yakuHan);
}

export default function YakuHanPage() {
  return (
    <PracticeIntroContent
      namespace="yakuHanChallenge"
      slug={PRACTICE_SLUG.yakuHan}
      howToPlay={<YakuHanHowToPlay />}
    />
  );
}
