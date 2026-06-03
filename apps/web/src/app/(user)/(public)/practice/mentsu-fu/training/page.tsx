/**
 * 面子符練習 トレーニング
 *
 * @description
 * 面子符練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 回答ごとにフィードバックを挟んで次の問題へ自動で進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { MentsuFuTrainingView } from "../_components/mentsu-fu-training-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function MentsuFuTrainingPage() {
  return <MentsuFuTrainingView />;
}
