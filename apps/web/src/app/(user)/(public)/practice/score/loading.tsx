import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";

/** 点数訓練（説明 / play）の読み込み中スケルトン。結果ページを持たないため汎用のみ */
export default function Loading() {
  return <PageSkeleton />;
}
