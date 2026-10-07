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
  compact = false,
}: {
  readonly columns: number;
  readonly rows?: number;
  readonly compact?: boolean;
}) {
  return (
    <div className="admin-table" aria-hidden="true">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className={compact ? "px-4 py-2" : "px-4 py-3"}>
                <SkeletonBar className={compact ? "h-4 w-16" : "h-5 w-16"} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="border-t border-surface-200">
              {Array.from({ length: columns }, (__, j) => (
                <td key={j} className="px-4 py-3">
                  <SkeletonBar className="h-5 w-24" />
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
    <div
      aria-hidden="true"
      className="admin-filter flex flex-wrap items-end gap-4"
    >
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="max-w-full">
          <SkeletonBar className="mb-1 h-5 w-20" />
          <SkeletonBar
            className={`h-[38px] max-w-full ${fields === 1 ? "w-72" : "w-52"}`}
          />
        </div>
      ))}
      <SkeletonBar className="h-[38px] w-20" />
    </div>
  );
}
