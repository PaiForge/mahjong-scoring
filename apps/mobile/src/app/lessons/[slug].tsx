import { useLocalSearchParams } from "expo-router";

import { LessonScreen } from "../../lessons/lesson-screen";

/**
 * レッスン
 *
 * @description
 * 教本の章 1 つ。本文を読み、確認問題を持つ章は確認問題を解いて完了にする
 * （持たない章は章末のボタンで完了にする）。完了は端末に記録され、目次の
 * 完了の印と進捗になる。
 *
 * @flow
 * 1. レッスンの目次（タブ）・道場・練習・本文中の章リンクから開く
 * 2. 本文 → 「確認問題へ」→ 1 問ずつ答えて解説を読む → できたことの確認
 * 3. 完了画面の次の一歩（次のレッスン・練習）または関連する練習へ。次の
 *    レッスンへはこの画面を置き換えて進み、戻るで開いた画面へ帰る
 */
export default function LessonPage() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  return <LessonScreen key={slug} slug={slug} />;
}
