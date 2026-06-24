import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";

/**
 * アクティビティログのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitle>
        <div className="h-8 w-48 bg-surface-200 rounded animate-pulse" />
      </AdminPageTitle>
      {/* フィルタ（実: flex items-end gap-4、各コントロールにラベル + 送信ボタン） */}
      <div className="flex items-end gap-4">
        <div>
          <div className="mb-1 h-4 w-20 bg-surface-200 rounded animate-pulse" />
          <div className="h-[38px] w-40 bg-surface-200 rounded animate-pulse" />
        </div>
        <div>
          <div className="mb-1 h-4 w-20 bg-surface-200 rounded animate-pulse" />
          <div className="h-[38px] w-40 bg-surface-200 rounded animate-pulse" />
        </div>
        <div className="h-[38px] w-20 bg-surface-200 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: 5 }, (_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 w-16 bg-surface-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => (
              <tr key={i} className="border-t border-gray-200">
                {Array.from({ length: 5 }, (__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
