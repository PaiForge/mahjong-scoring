/**
 * 翻数即答 結果
 *
 * @description
 * 翻数即答ドリルの結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. ドリル終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開式アコーディオン）
 * 4. 全期間リーダーボード上位3名を表示
 * 5. リーダーボード詳細ページへのリンク
 * 6. リトライまたは練習一覧に戻るボタン
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { createPracticeResultPage } from "../../_lib/create-practice-result-page";
import { HanCountResultView } from "../_components/han-count-result-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hanCountDrill");
  const tChallenge = await getTranslations("challenge");
  return createMetadata({ title: `${t("title")} - ${tChallenge("resultSuffix")}` });
}

export const dynamic = 'force-dynamic';

export default createPracticeResultPage(HanCountResultView, {
  module: 'han_count',
  playHref: '/practice/han-count/play',
});
