import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * チャレンジ全履歴のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <span className="inline-block h-7 w-48 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      {/* SectionTitle placeholder */}
      <div className="h-7 w-32 animate-pulse rounded bg-surface-200" />

      <div className="mt-6 space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                {Array.from({ length: 4 }, (_, i) => (
                  <th key={i} className="py-2 px-2 sm:px-3">
                    <div className="h-4 w-16 bg-surface-200 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  {Array.from({ length: 4 }, (__, j) => (
                    <td key={j} className="py-2 px-2 sm:px-3">
                      <div className="h-4 w-20 bg-surface-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ContentContainer>
  );
}
