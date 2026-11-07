import type { Metadata } from "next";
import { createFreePracticePlayMetadata } from "../../_lib/metadata";
import { AgariScoreBoard } from "../_components/agari-score-board";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/agari-score/play">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/agari-score/play");
  return createFreePracticePlayMetadata("agariScore");
}

/**
 * 和了形の点数計算 プレイ
 *
 * @description
 * 和了形の点数計算のプレイページ。エンドレス自由練習形式で、
 * 制限時間やミス上限なく繰り返し練習できる。
 * 設定に応じて翻・符・点数（役も含む場合あり）を入力し正誤を確認する。
 *
 * @flow
 * 1. 設定ページからクエリパラメータを受け取り問題を生成
 * 2. 手牌と条件が表示され、翻・符・点数を入力して回答
 * 3. 正誤表示後、「次へ」で新しい問題を生成（自動次へ設定時は正解で自動遷移）
 * 4. 任意のタイミングで設定画面に戻るか終了できる
 */
export default async function ScorePlayPage({
  params,
}: PageProps<"/[locale]/practice/agari-score/play">) {
  await prepareRouteLocale(params, "/practice/agari-score/play");
  return <AgariScoreBoard />;
}
