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
    <div className="admin-table">
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
 * 並べ、末尾に送信ボタンを置く構成。
 *
 * @param fields - 「ラベル + コントロール」の数（既定 2 = ログ画面。ユーザー検索は 1）
 */
export function LogFilterSkeleton({
  fields = 2,
}: {
  readonly fields?: number;
}) {
  return (
    <div className="flex items-end gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <SkeletonBar className="mb-1 h-4 w-20" />
          <SkeletonBar className="h-[38px] w-40" />
        </div>
      ))}
      <SkeletonBar className="h-[38px] w-20" />
    </div>
  );
}
