import { PracticeLoading } from "@/app/(user)/(public)/practice/_components/practice-loading";

/**
 * 練習ルート（説明 / play / result）の読み込み中スケルトン。
 * slug は同ディレクトリの page.tsx と揃える。
 */
export default function Loading() {
  return <PracticeLoading slug="fu-score-exam" />;
}
