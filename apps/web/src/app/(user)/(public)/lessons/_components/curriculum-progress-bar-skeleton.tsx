import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 学習進捗バーの読み込み中プレースホルダ
 * 学習進捗バースケルトン
 *
 * `CurriculumProgressBar` と同じ構造（`space-y-2` / ラベル行 + トラック）で描画し、
 * 読了数・パーセンテージのテキストだけを矩形に置き換える。トラックの高さ
 * （`h-4`）は実物と同じものをそのまま描き、読み込み完了時に高さが変わらない
 * ようにする。
 *
 * 実物のトラックが持つ苔緑の太枠（`border-3 border-ink`）は写さない。
 * スケルトンは灰色の矩形だけで面を示す（`ProblemListSkeleton` と同じ理由 —
 * 読み込み中の画面が実物より賑やかに見えるため）。枠は border-box なので、
 * 外しても実物との高さは一致したまま。
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
      <div className="h-4 w-full overflow-hidden rounded-full bg-surface-200">
        <SkeletonBar radius="full" className="h-full w-1/4" tone={300} />
      </div>
    </div>
  );
}
