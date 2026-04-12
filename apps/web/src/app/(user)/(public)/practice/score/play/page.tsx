import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillBoard } from "../_components/drill-board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("score");
  return createMetadata({ title: t("title") });
}

/**
 * 点数計算総合演習 プレイ
 *
 * @description
 * 点数計算総合演習のプレイページ。エンドレス自由練習形式で、
 * 制限時間やミス上限なく繰り返し練習できる。
 * 設定に応じて翻・符・点数（役も含む場合あり）を入力し正誤を確認する。
 *
 * @flow
 * 1. 設定ページからクエリパラメータを受け取り問題を生成
 * 2. 手牌と条件が表示され、翻・符・点数を入力して回答
 * 3. 正誤表示後、「次へ」で新しい問題を生成（自動次へ設定時は正解で自動遷移）
 * 4. 任意のタイミングで設定画面に戻るか終了できる
 */
export default function ScorePlayPage() {
  return <DrillBoard />;
}
