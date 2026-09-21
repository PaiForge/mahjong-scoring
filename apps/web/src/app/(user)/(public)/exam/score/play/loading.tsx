import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { ExamPlayLoading } from "../../_components/exam-play-loading";

/**
 * 昇級試験の出題画面の読み込み中スケルトン。slug は親ディレクトリの page.tsx と揃える。
 * 本番の試験は受験資格を確かめる動的ルートなので境界を持つ（説明 / 模試は静的で
 * 境界を持たない。`loading-boundaries.test.ts` 参照）。
 */
export default function Loading() {
  return <ExamPlayLoading slug={PRACTICE_SLUG.scoreExam} />;
}
