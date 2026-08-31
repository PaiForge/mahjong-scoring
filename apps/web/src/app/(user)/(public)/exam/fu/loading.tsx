import { PracticeLoading } from "@/app/(user)/(public)/practice/_components/practice-loading";

/**
 * 練習ルート（説明 / play / result）の読み込み中スケルトン。
 * slug は同ディレクトリの page.tsx と揃える。
 */
export default function Loading() {
  // 合計符の試験のデモだけ手牌の下に符の内訳が付き、他の試験より高い
  return <PracticeLoading slug="fu-exam" demoHeight="tall" />;
}
