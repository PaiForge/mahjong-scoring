/**
 * 手牌符練習 トレーニング
 *
 * @description
 * 手牌符練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 各符目に入力して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { TehaiFuTrainingView } from "../_components/tehai-fu-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata("tehaiFu");
}

export default function TehaiFuTrainingPage() {
  return <TehaiFuTrainingView />;
}
