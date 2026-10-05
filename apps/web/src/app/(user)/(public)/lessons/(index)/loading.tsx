import { LearnIndexSkeleton } from "../_components/learn-index-skeleton";

/** 教本（目次）の読み込み中スケルトン。目次は読了状態を読む動的ルートなので境界を持つ */
export default function Loading() {
  return <LearnIndexSkeleton />;
}
