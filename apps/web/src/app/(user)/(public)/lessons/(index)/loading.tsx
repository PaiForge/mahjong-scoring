import { LearnIndexSkeleton } from "../_components/learn-index-skeleton";

/**
 * 教本（目次）の読み込み中スケルトン。目次は読了状態を読む動的ルートなので境界を持つ
 *
 * route group `(index)` は、この index の loading.tsx が兄弟ルート（静的な `/lessons/<slug>`）の
 * 祖先にならないようにするためだけにある。不変条件（動的ルートは loading.tsx を 1 枚・
 * 静的ルートは 0 枚）と理由は `apps/web/src/app/loading-boundaries.test.ts`。page.tsx と
 * loading.tsx を 1 つ上に移すとそのテストが落ちる。
 */
export default function Loading() {
  return <LearnIndexSkeleton />;
}
