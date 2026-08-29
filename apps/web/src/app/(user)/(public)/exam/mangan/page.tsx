/**
 * 昇級試験（満貫以上の点数計算） 説明
 *
 * @description
 * 昇級試験の説明ページ。役の表示なしで手牌から翻数を数え、満貫以上の点数を
 * 答える試験形式のチャレンジ。通常チャレンジと異なりミス1回で終了する
 * （レジストリの mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. 道場・教本の役の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモ（役一覧なし）と合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 総合演習（`/practice/score`）の上に作らなかった理由
 *
 * 出題内容だけ見れば `/practice/score` を絞り込めば足りそうに見えるが、
 * あちらは終了条件を持たず記録も取らない訓練で、出題設定がすべてクエリに
 * 露出していて改竄できる（zustand のシングルトンにも載っている）。合否が
 * 段級位という永続的な記録になる試験の器としては要件が噛み合わない。
 *
 * 代わりに他のチャレンジ型練習と同じ分離軸を踏襲する: 出題は core の
 * `generateValidScoreQuestion`、盤面の状態は `useScoreQuestionBoard` を
 * 共有し、器（ディレクトリと出題条件）だけを分ける
 * （score-calculation / mangan-score-calculation と同じ構図）。
 */
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
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
