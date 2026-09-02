import type { Metadata } from "next";
import { createPracticePlayMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { createExamPlayPage } from "../../_lib/create-exam-play-page";
import { ScoreExamPlayView } from "../_components/score-exam-play-view";

const SLUG = "score-exam" as const;

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata(SLUG);
}

/**
 * 昇段試験（あらゆる手の点数計算） プレイ
 *
 * @description
 * 出題範囲を絞らない手牌から点数を回答する試験のプレイページ。役一覧も符も
 * 表示されず、点数の選択肢もその親子・ツモロンで取りうる全点数が並ぶため、
 * プレイヤーは手牌から符を積み上げ、翻数を数え、満貫以上かどうかの判断まで
 * 含めて通しで行う。平和・七対子・鳴いた手・満貫以上が区別なく出る。
 * ミス1回で終了する（通常チャレンジは3回）。
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

export default createExamPlayPage(ScoreExamPlayView, { slug: SLUG });
