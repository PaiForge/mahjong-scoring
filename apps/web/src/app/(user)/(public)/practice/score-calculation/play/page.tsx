import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreCalculationPlayView } from "../_components/score-calculation-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreCalculationChallenge");
  return createMetadata({ title: t("title") });
}

/**
 * 点数計算ドリル プレイ
 *
 * @description
 * 点数計算ドリルのプレイページ。手牌から翻・符を読み取り、点数をセレクトで回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と条件が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス3回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function ScoreCalculationPlayPage() {
  return <ScoreCalculationPlayView />;
}
