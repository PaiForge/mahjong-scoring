/**
 * 手牌の合計符練習 トレーニング
 *
 * @description
 * 手牌の合計符練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 符を選んで判定、符の内訳を確認してから次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { TotalFuTrainingView } from "../_components/total-fu-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata("total-fu");
}

export default function TotalFuTrainingPage() {
  return <TotalFuTrainingView />;
}
