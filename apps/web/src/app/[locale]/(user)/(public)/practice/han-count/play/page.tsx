import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { HanCountPlayView } from "../_components/han-count-play-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/han-count/play">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/practice/han-count/play");
  return createPracticePlayMetadata(PRACTICE_SLUG.hanCount, { locale });
}

/**
 * 翻数即答 プレイ
 *
 * @description
 * 翻数即答練習のプレイページ。手牌から合計翻数を制限時間内に回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と条件が表示され、合計翻数を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default async function HanCountPlayPage({
  params,
}: PageProps<"/[locale]/practice/han-count/play">) {
  await prepareRouteLocale(params, "/practice/han-count/play");
  return <HanCountPlayView />;
}
