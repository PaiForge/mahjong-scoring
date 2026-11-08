/**
 * 役の翻数 結果
 *
 * @description
 * 役翻数練習の結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. 練習終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開式アコーディオン）
 * 4. 全期間リーダーボード上位3名を表示
 * 5. リーダーボード詳細ページへのリンク
 * 6. リトライ・出題範囲の変更ボタンと、練習一覧へのリンク
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "../../_lib/create-practice-result-page";
import { YakuHanResultView } from "../_components/yaku-han-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.yakuHan;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/yaku-han/result">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/practice/yaku-han/result");
  return createPracticeResultMetadata(SLUG, { locale });
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(YakuHanResultView, {
  slug: SLUG,
});

export default async function YakuHanResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/practice/yaku-han/result">) {
  await prepareRouteLocale(params, "/practice/yaku-han/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
