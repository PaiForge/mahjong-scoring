import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 管理画面のテーブルスケルトン
 * テーブルスケルトン
 *
 * @param columns - 列数（実際のテーブルに合わせる）
 * @param rows - 行数（既定 10 = 1ページ分）
 */
export function TableSkeleton({
  columns,
  rows = 10,
}: {
  readonly columns: number;
  readonly rows?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-3">
                <SkeletonBar className="h-4 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="border-t border-gray-200">
              {Array.from({ length: columns }, (__, j) => (
                <td key={j} className="px-4 py-3">
                  <SkeletonBar className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ログ画面のフィルタ行スケルトン
 * ログフィルタスケルトン
 *
 * 実際のフィルタは `flex items-end gap-4` に「ラベル + コントロール」を
 * 2つ並べ、末尾に送信ボタンを置く構成。
 */
export function LogFilterSkeleton() {
  return (
    <div className="flex items-end gap-4">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i}>
          <SkeletonBar className="mb-1 h-4 w-20" />
          <SkeletonBar className="h-[38px] w-40" />
        </div>
      ))}
      <SkeletonBar className="h-[38px] w-20" />
    </div>
  );
}
