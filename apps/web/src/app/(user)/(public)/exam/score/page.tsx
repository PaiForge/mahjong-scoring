/**
 * 昇段試験（あらゆる手の点数計算） 説明
 *
 * @description
 * 昇段試験の説明ページ。役の表示なしで、出題範囲を絞らない手牌から点数を
 * 答える試験形式のチャレンジ。平和・七対子・面子手（門前・副露）・満貫以上が
 * 区別なく出る。通常チャレンジと異なりミス1回で終了する（レジストリの
 * mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. 道場・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモ（役一覧なし）と合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 下の級の試験と器を分ける理由
 *
 * 出題形式も回答フォームも 1級 までの試験と同じで、違うのは出題条件だけ。
 * それでも1つの試験にまとめないのは、ベストスコアが別々に積まれる必要が
 * あるため。昇段判定は `challenge_best_scores` の
 * (menuType, leaderboardKey) 単位のベストスコアを見るので、混ぜると
 * 「1級は取れたが初段はまだ」という状態が表せない。段級位1つにつき試験1つ、
 * が段級位レジストリの前提でもある。
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { ScoreExamHowToPlay } from "./_components/score-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.scoreExam);
}

export default function ScoreExamPage() {
  return (
    <PracticeIntroContent
      namespace="scoreExamChallenge"
      slug={PRACTICE_SLUG.scoreExam}
      howToPlay={<ScoreExamHowToPlay />}
      notice={<ExamConditions slug={PRACTICE_SLUG.scoreExam} />}
    />
  );
}
