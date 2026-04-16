import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ManganScoreCalculationPlayView } from "../_components/mangan-score-calculation-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("manganScoreCalculationChallenge");
  return createMetadata({ title: t("title") });
}

/**
 * 満貫以上点数計算ドリル プレイ
 *
 * @description
 * 満貫以上の手牌から点数を回答するドリルのプレイページ。
 * 役一覧と翻数が表示されるため、プレイヤーは翻数から点数を導出する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌・条件・役一覧が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス3回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function ManganScoreCalculationPlayPage() {
  return (
    <Suspense>
      <ManganScoreCalculationPlayView />
    </Suspense>
  );
}
