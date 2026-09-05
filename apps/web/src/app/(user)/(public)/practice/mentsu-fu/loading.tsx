import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { PracticeLoading } from "../_components/practice-loading";

/**
 * 練習ルート（説明 / play / training / result）の読み込み中スケルトン。
 * slug は同ディレクトリの page.tsx と揃える。
 */
export default function Loading() {
  return <PracticeLoading slug={PRACTICE_SLUG.mentsuFu} />;
}
