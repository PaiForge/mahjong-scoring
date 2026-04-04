/**
 * 点数表早引き 結果
 *
 * @description
 * 点数表早引きドリルの結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. ドリル終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 全期間リーダーボード上位3名を表示
 * 4. リーダーボード詳細ページへのリンク
 * 5. リトライまたは練習一覧に戻るボタン
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ResultClient } from "../../_components/result-client";
import { createPracticeResultPage } from "../../_lib/create-practice-result-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableDrill");
  const tChallenge = await getTranslations("challenge");
  return createMetadata({ title: `${t("title")} - ${tChallenge("resultSuffix")}` });
}

export const dynamic = 'force-dynamic';

export default createPracticeResultPage(ResultClient, {
  module: 'score_table',
  playHref: '/practice/score-table/play',
});
