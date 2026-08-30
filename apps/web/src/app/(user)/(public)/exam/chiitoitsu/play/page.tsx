import type { Metadata } from "next";
import { createPracticePlayMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { ChiitoitsuExamPlayView } from "../_components/chiitoitsu-exam-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata("chiitoitsuExamChallenge");
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
export default function ChiitoitsuExamPlayPage() {
  return <ChiitoitsuExamPlayView />;
}
