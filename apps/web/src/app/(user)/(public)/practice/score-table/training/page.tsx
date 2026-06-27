/**
 * 点数表早引き練習 トレーニング
 *
 * @description
 * 点数表早引き練習のトレーニングモード。時間無制限・ミス無制限で反復練習でき、
 * スコアはリーダーボードに記録しない。
 *
 * @flow
 * 1. 説明ページの「トレーニング」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 点数を回答して判定、フィードバックを挟んで次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTableTrainingView } from "../_components/score-table-training-view";
import {
  searchParamsToSelection,
  selectionToGeneratorOptions,
} from "../_lib/options";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreTableTrainingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const selection = searchParamsToSelection(await searchParams);
  return (
    <ScoreTableTrainingView
      generatorOptions={selectionToGeneratorOptions(selection)}
    />
  );
}
