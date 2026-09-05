import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { MentsuJantouFuPlayView } from "../_components/mentsu-jantou-fu-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata(PRACTICE_SLUG.mentsuJantouFu);
}

/**
 * 面子と雀頭の符計算 プレイ
 *
 * @description
 * 面子と雀頭の符計算のプレイページ。手牌の各面子・雀頭の符を制限時間内に繰り返し回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と各構成要素が表示され、それぞれの符を選択
 * 3. 問題別の回答結果を sessionStorage に保存
 * 4. 制限時間経過またはミス3回で終了
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function MentsuJantouFuPlayPage() {
  return <MentsuJantouFuPlayView />;
}
