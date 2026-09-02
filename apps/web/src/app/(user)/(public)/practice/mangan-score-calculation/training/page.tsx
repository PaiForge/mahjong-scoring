/**
 * 満貫以上点数計算ドリル トレーニング
 *
 * @description
 * 満貫以上点数計算ドリルのトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 点数を回答して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { ManganScoreCalculationTrainingView } from "../_components/mangan-score-calculation-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata("mangan-score-calculation");
}

export default function ManganScoreCalculationTrainingPage() {
  return <ManganScoreCalculationTrainingView />;
}
