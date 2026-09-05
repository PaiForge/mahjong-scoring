/**
 * 翻数即答練習 トレーニング
 *
 * @description
 * 翻数即答練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 翻数を入力して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "../../_lib/metadata";
import { HanCountTrainingView } from "../_components/han-count-training-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeTrainingMetadata(PRACTICE_SLUG.hanCount);
}

export default function HanCountTrainingPage() {
  return <HanCountTrainingView />;
}
