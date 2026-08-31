import type { Metadata } from "next";
import { createPracticePlayMetadata } from "@/app/(user)/(public)/practice/_lib/metadata";
import { redirectUnlessExamEligible } from "../../_lib/exam-guard";
import { FuExamPlayView } from "../_components/fu-exam-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata("fuExamChallenge");
}

/**
 * 昇級試験（手牌の合計符） プレイ
 *
 * @description
 * 手牌全体の符を合計し、10符単位に切り上げた符を回答する試験のプレイページ。
 * 符の内訳は表示されないため、副底から待ち符までを自分で積み上げる。
 * ミス1回で終了する（通常チャレンジは3回）。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌・状況が表示され、符を選択肢から1つ選ぶ
 * 3. 制限時間経過またはミス1回で終了
 * 4. 問題別の回答結果を sessionStorage に保存
 * 5. スコアを保存し、result ページへリダイレクト
 */
// 受験ガードが cookie を読むため動的レンダリングを明示する
export const dynamic = "force-dynamic";

export default async function FuExamPlayPage() {
  await redirectUnlessExamEligible("fu-exam");
  return <FuExamPlayView />;
}
