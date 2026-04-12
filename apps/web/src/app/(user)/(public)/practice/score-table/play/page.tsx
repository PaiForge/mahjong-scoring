import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTablePlayView } from "../_components/score-table-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableChallenge");
  return createMetadata({ title: t("title") });
}

/**
 * 点数表早引き プレイ
 *
 * @description
 * 点数表早引きドリルのプレイページ。翻数・符・親子・ツモロンの条件が文字で表示され、
 * 対応する点数をセレクトで回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 翻数・符・親子・ツモロンの条件が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス3回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function ScoreTablePlayPage() {
  return <ScoreTablePlayView />;
}
