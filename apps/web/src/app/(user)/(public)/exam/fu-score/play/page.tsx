import type { Metadata } from "next";
import { createPracticePlayMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { FuScoreExamPlayView } from "../_components/fu-score-exam-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata("fuScoreExamChallenge");
}

/**
 * 昇級試験（30〜50符の点数計算） プレイ
 *
 * @description
 * 満貫未満・30〜50符の手牌から点数を回答する試験のプレイページ。役一覧も
 * 符も表示されないため、プレイヤーは手牌から符を積み上げ、翻数を数え、
 * 点数表を引くところまでを通しで行う。門前手と鳴いた手の両方が出る。
 * ミス1回で終了する（通常チャレンジは3回）。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌・条件が表示され、点数をセレクトで回答
 * 3. 制限時間経過またはミス1回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function FuScoreExamPlayPage() {
  return <FuScoreExamPlayView />;
}
