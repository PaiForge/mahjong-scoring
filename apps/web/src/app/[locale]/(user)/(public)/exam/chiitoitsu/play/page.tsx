import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "@/app/[locale]/(user)/(public)/practice/_lib/metadata";
import { createExamPlayPage } from "../../_lib/create-exam-play-page";
import { ChiitoitsuExamPlayView } from "../_components/chiitoitsu-exam-play-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.chiitoitsuExam;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/exam/chiitoitsu/play">): Promise<Metadata> {
  await prepareRouteLocale(params, "/exam/chiitoitsu/play");
  return createPracticePlayMetadata(SLUG);
}

/**
 * 昇級試験（七対子の点数計算） プレイ
 *
 * @description
 * 七対子で和了した満貫未満の手牌から点数を回答する試験のプレイページ。
 * 役一覧は表示されないため、プレイヤーは手牌から翻数を自分で数え、25符の
 * 点数表から点数を導出する。ミス1回で終了する（通常チャレンジは3回）。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌・条件が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス1回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
// 受験ガードが cookie を読むため動的レンダリングを明示する
export const dynamic = "force-dynamic";

const ExamPlayPage = createExamPlayPage(ChiitoitsuExamPlayView, { slug: SLUG });

export default async function ChiitoitsuExamPlayPage({
  params,
}: PageProps<"/[locale]/exam/chiitoitsu/play">) {
  await prepareRouteLocale(params, "/exam/chiitoitsu/play");
  return <ExamPlayPage />;
}
