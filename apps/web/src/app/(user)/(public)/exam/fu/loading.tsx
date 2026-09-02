import { PracticeLoading } from "@/app/(user)/(public)/practice/_components/practice-loading";

/**
 * 練習ルート（説明 / play / result）の読み込み中スケルトン。
 * slug は同ディレクトリの page.tsx と揃える。
 */
export default function Loading() {
  // 合計符の試験だけ、説明ページのデモは符の内訳が付き、出題画面は選択肢が
  // 11 個並ぶ。どちらも他の試験より高い
  return (
    <PracticeLoading slug="fu-exam" demoHeight="tall" boardHeight="tall" />
  );
}
