import { PageTitle } from "@/app/_components/page-title";

/**
 * 監査ログのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div>
      <PageTitle className="mb-6">
        <div className="h-8 w-40 bg-surface-200 rounded animate-pulse" />
      </PageTitle>
      <div className="flex gap-3 mb-4">
        <div className="h-10 w-40 bg-surface-200 rounded animate-pulse" />
        <div className="h-10 w-40 bg-surface-200 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: 6 }, (_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 w-16 bg-surface-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => (
              <tr key={i} className="border-t border-gray-200">
                {Array.from({ length: 6 }, (_, j) => (
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
