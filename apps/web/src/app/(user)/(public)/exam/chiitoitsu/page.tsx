/**
 * 昇級試験（七対子の点数計算） 説明
 *
 * @description
 * 昇級試験の説明ページ。役の表示なしで七対子の手牌から翻数を数え、25符の
 * 点数を答える試験形式のチャレンジ。通常チャレンジと異なりミス1回で終了する
 * （レジストリの mistakeLimit: 1）。トレーニングモードは持たない（試験のため）。
 *
 * @flow
 * 1. 道場・教本の七対子の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモ（役一覧なし）と合格条件、「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 *
 * @design 章の練習（`/practice/score` の七対子絞り込み）の上に作らなかった理由
 *
 * 教本の七対子の章が案内している練習は総合演習の絞り込みで、終了条件を持たず
 * 記録も取らない。出題設定はすべてクエリに露出していて改竄でき、合否が段級位
 * という永続的な記録になる試験の器としては要件が噛み合わない（満貫の昇級試験と
 * 同じ理由）。
 *
 * 代わりに他の試験と同じ分離軸を踏襲する: 出題は core の
 * `generateValidScoreQuestion`、盤面の状態は `useScoreQuestionBoard`、
 * 回答フォームは `ScoreAnswerForm` を共有し、器（ディレクトリと出題条件）だけを
 * 分ける。
 */
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { ChiitoitsuExamHowToPlay } from "./_components/chiitoitsu-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata("chiitoitsu-exam");
}

export default function ChiitoitsuExamPage() {
  return (
    <PracticeIntroContent
      namespace="chiitoitsuExamChallenge"
      slug="chiitoitsu-exam"
      howToPlay={<ChiitoitsuExamHowToPlay />}
      notice={<ExamConditions slug="chiitoitsu-exam" />}
    />
  );
}
