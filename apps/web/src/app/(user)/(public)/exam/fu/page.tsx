/**
 * 昇級試験（手牌の合計符） 説明
 *
 * @description
 * 昇級試験の説明ページ。手牌全体の符を合計し、切り上げ後の符を答える試験形式の
 * チャレンジ。通常チャレンジと異なりミス1回で終了する（レジストリの
 * mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. 道場・教本の手牌の符の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモと合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 合計符の練習（`/practice/total-fu`）と器を分ける理由
 *
 * 出題内容は合計符の練習と同じで、違うのはセッションのルール（ミス1回で終了）と
 * 出題条件（連風牌の局面を出さない）だけ。それでも練習側にモードを足さずに
 * 器を分けるのは、ベストスコアが別々に積まれる必要があるため。昇級判定は
 * `challenge_best_scores` の (menuType, leaderboardKey) 単位のベストスコアを
 * 見るので、ミス3回まで許される練習の記録と混ぜると「ミス1回で終了する走行で
 * 合格点に達した」という合格条件が表せなくなる。
 *
 * 器を分けたうえで、出題の生成（core の `generateTotalFuQuestion`）・盤面の状態
 * （`useFuChoiceBoard`）・結果の一覧（`FuProblemList`）は練習と共有する
 * （満貫の昇級試験と同じ構図）。
 */
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { FuExamHowToPlay } from "./_components/fu-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata("fu-exam");
}

export default function FuExamPage() {
  return (
    <PracticeIntroContent
      namespace="fuExamChallenge"
      slug="fu-exam"
      howToPlay={<FuExamHowToPlay />}
      notice={<ExamConditions slug="fu-exam" />}
    />
  );
}
