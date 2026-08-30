/**
 * 昇級試験（平和の点数計算） 説明
 *
 * @description
 * 昇級試験の説明ページ。役の表示なしで平和の手牌から翻数を数え、ツモ20符・
 * ロン30符の点数を答える試験形式のチャレンジ。通常チャレンジと異なりミス1回で
 * 終了する（レジストリの mistakeLimit: 1）。トレーニングモードは持たない
 * （試験のため）。
 *
 * @flow
 * 1. 道場・教本の平和の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモ（役一覧なし）と合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 七対子の試験（3級）と器を分ける理由
 *
 * 出題形式も回答フォームも同じで、違うのは出題条件（役と符）だけ。それでも
 * 1つの試験にまとめないのは、ベストスコアが別々に積まれる必要があるため。
 * 昇級判定は `challenge_best_scores` の (menuType, leaderboardKey) 単位の
 * ベストスコアを見るので、混ぜると「3級は取れたが2級はまだ」という状態が
 * 表せない。級ごとに1つの試験、が段級位レジストリの前提でもある。
 */
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { PinfuExamHowToPlay } from "./_components/pinfu-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata("pinfu-exam");
}

export default function PinfuExamPage() {
  return (
    <PracticeIntroContent
      namespace="pinfuExamChallenge"
      slug="pinfu-exam"
      howToPlay={<PinfuExamHowToPlay />}
      notice={<ExamConditions slug="pinfu-exam" />}
    />
  );
}
