import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { MentsuFuPlayView } from "../_components/mentsu-fu-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata(PRACTICE_SLUG.mentsuFu);
}

/**
 * 面子符練習 プレイ
 *
 * @description
 * 面子符練習のプレイページ。面子の形からの符計算を制限時間内に繰り返し回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 面子が表示され、符を選択
 * 3. 問題別の回答結果を sessionStorage に保存
 * 4. 制限時間経過またはミス3回で終了
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function MentsuFuPlayPage() {
  return <MentsuFuPlayView />;
}
