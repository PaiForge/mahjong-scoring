import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 学習進捗バーの読み込み中プレースホルダ
 * 学習進捗バースケルトン
 *
 * `CurriculumProgressBar` と同じ構造（`space-y-2` / ラベル行 + トラック）で描画し、
 * 読了数・パーセンテージのテキストだけを矩形に置き換える。トラックの高さ
 * （`h-2`）は実物と同じものをそのまま描き、読み込み完了時に高さが変わらない
 * ようにする。
 *
 * 読み込み中はトラックと進捗をグレーで表示する。
 */
export function CurriculumProgressBarSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <SkeletonBar as="span" className="inline-block w-28">
          &nbsp;
        </SkeletonBar>
        <SkeletonBar as="span" className="inline-block w-8">
          &nbsp;
        </SkeletonBar>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
        <SkeletonBar radius="full" className="h-full w-1/4" tone={300} />
      </div>
    </div>
  );
}
