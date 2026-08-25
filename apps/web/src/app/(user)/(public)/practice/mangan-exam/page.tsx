/**
 * 昇級試験（満貫以上の点数計算） 説明
 *
 * @description
 * 昇級試験の説明ページ。役の表示なしで手牌から翻数を数え、満貫以上の点数を
 * 答える試験形式のチャレンジ。通常チャレンジと異なりミス1回で終了する
 * （レジストリの mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. ユーザーが練習一覧または教本の役の章から遷移
 * 2. 問題方式のデモ（役一覧なし）と「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ManganExamConditions } from "./_components/mangan-exam-conditions";
import { ManganExamHowToPlay } from "./_components/mangan-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata("mangan-exam");
}

export default function ManganExamPage() {
  return (
    <PracticeIntroContent
      namespace="manganExamChallenge"
      slug="mangan-exam"
      howToPlay={<ManganExamHowToPlay />}
      notice={<ManganExamConditions />}
    />
  );
}
