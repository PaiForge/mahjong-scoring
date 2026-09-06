/**
 * 昇級試験（手牌の合計符） 説明
 *
 * @description
 * 昇級試験の説明ページ。手牌全体の符を合計し、切り上げ後の符を答える試験形式の
 * チャレンジ。通常チャレンジと異なりミス1回で終了する（レジストリの
 * mistakeLimit: 1）。模試（`training`。時間無制限・記録なしのトレーニング）を持つ。
 *
 * @flow
 * 1. 道場・教本の手牌の符の章・ダッシュボードの試験カードから遷移
 *    （練習一覧には並ばない。入口は段級位の側が持つ）
 * 2. 問題方式のデモと合格条件、「スタート」（本番）と「模試を受ける」の
 *    ボタンが表示される。本番は受験資格が無ければ登録・道場への導線になる
 * 3. 「スタート」を押すと play ページへ、「模試を受ける」を押すと training
 *    ページへ遷移
 *
 * @design 合計符の練習（`/practice/total-fu`）と器を分ける理由
 *
 * 出題内容は合計符の練習と同じで、違うのはセッションのルール（ミス1回で終了）と
 * 出題条件（連風牌の局面を出さない）だけ。それでも練習側にモードを足さずに
 * 器を分けるのは、試験の走行が記録に載らない（ランキング・マイレコード・
 * EXP の対象外で、合否だけを判定する）ため。練習側にモードを足すと、
 * 記録する練習と記録しない試験が同じ menuType に同居して、保存の入口で
 * 区別できなくなる。ミス上限の違い（試験は1回）もレジストリの単位で
 * 表したい。
 *
 * 器を分けたうえで、出題の生成（core の `generateTotalFuQuestion`）・盤面の状態
 * （`useFuChoiceBoard`）・結果の一覧（`FuProblemList`）は練習と共有する
 * （満貫の昇級試験と同じ構図）。
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { PracticeIntroContent } from "@/app/(user)/(public)/practice/_components/practice-intro-content";
import { ExamConditions } from "../_components/exam-conditions";
import { FuExamHowToPlay } from "./_components/fu-exam-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.fuExam);
}

export default function FuExamPage() {
  return (
    <PracticeIntroContent
      namespace="fuExamChallenge"
      slug={PRACTICE_SLUG.fuExam}
      howToPlay={<FuExamHowToPlay />}
      notice={<ExamConditions slug={PRACTICE_SLUG.fuExam} />}
    />
  );
}
