/**
 * 昇級試験（満貫以上の点数計算） 模試
 *
 * @description
 * 昇級試験の模試（トレーニング）。本番と同じ出題条件・回答形式を時間無制限・
 * 記録なしで解き、1 問ごとに正解を確認してから次へ進む。合否の判定も段級位の
 * 付与も無いため受験資格のガードは掛けず、未ログインでも受けられる
 * （cookie を読まないので静的に配信できる）。
 *
 * @flow
 * 1. 説明ページの「模試を受ける」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 点数を回答して判定、正解の点数を確認してから次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る。末尾の導線から本番の試験へも進める
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { ManganExamTrainingView } from "../_components/mangan-exam-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata(PRACTICE_SLUG.manganExam);
}

export default function ManganExamTrainingPage() {
  return <ManganExamTrainingView />;
}
