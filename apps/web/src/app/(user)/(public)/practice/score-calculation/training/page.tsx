/**
 * 点数計算練習 トレーニング
 *
 * @description
 * 点数計算練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
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
import { ScoreCalculationTrainingView } from "../_components/score-calculation-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata("score-calculation");
}

export default function ScoreCalculationTrainingPage() {
  return <ScoreCalculationTrainingView />;
}
