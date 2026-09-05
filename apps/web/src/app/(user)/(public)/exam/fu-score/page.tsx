/**
 * 昇級試験（30〜50符の点数計算） 説明
 *
 * @description
 * 昇級試験の説明ページ。役の表示なしで面子手（門前・副露）の手牌から符を
 * 積み上げ、翻数を数え、30〜50符の点数表を引いて点数を答える試験形式の
 * チャレンジ。通常チャレンジと異なりミス1回で終了する（レジストリの
 * mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. 道場・教本の鳴いた手の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモ（役一覧なし）と合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 下の級の試験と器を分ける理由
 *
 * 出題形式も回答フォームも 2級・3級 の試験と同じで、違うのは出題条件だけ。
 * それでも1つの試験にまとめないのは、ベストスコアが別々に積まれる必要が
 * あるため。昇級判定は `challenge_best_scores` の
 * (menuType, leaderboardKey) 単位のベストスコアを見るので、混ぜると
 * 「2級は取れたが1級はまだ」という状態が表せない。級ごとに1つの試験、が
 * 段級位レジストリの前提でもある。
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { FuScoreExamHowToPlay } from "./_components/fu-score-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.fuScoreExam);
}

export default function FuScoreExamPage() {
  return (
    <PracticeIntroContent
      namespace="fuScoreExamChallenge"
      slug={PRACTICE_SLUG.fuScoreExam}
      howToPlay={<FuScoreExamHowToPlay />}
      notice={<ExamConditions slug={PRACTICE_SLUG.fuScoreExam} />}
    />
  );
}
