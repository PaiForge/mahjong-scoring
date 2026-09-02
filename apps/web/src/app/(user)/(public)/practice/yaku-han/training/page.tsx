/**
 * 役の翻数 トレーニング
 *
 * @description
 * 役翻数練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 翻数を選択して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { YakuHanTrainingView } from "../_components/yaku-han-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata("yaku-han");
}

export default function YakuHanTrainingPage() {
  return <YakuHanTrainingView />;
}
