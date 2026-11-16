import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 期間ピッカー（`DateRangePicker`）のスケルトン
 * 期間ピッカースケルトン
 *
 * 実体はラベル + 日付入力 ×2 と、プリセットのセグメント。期間ピッカーを置く
 * ページ（ダッシュボード・レッスンの完了状況）の loading.tsx が共有する。
 */
export function DateRangePickerSkeleton() {
  return (
    // 高さ 38px は入力欄（文字 20px + 余白 8px × 2 + 枠 1px × 2）と
    // セグメント（ボタン 32px + 内側の余白 2px × 2 + 枠 1px × 2）で共通
    <div className="admin-filter flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-4 w-12" tone={100} />
        <SkeletonBar radius="lg" className="h-[38px] w-40" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-4 w-12" tone={100} />
        <SkeletonBar radius="lg" className="h-[38px] w-40" />
      </div>
      <SkeletonBar radius="lg" className="h-[38px] w-[246px]" tone={100} />
    </div>
  );
}
