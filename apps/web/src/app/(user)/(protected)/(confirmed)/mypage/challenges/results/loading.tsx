import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * チャレンジ全履歴のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <SkeletonBar
          className="inline-block h-7 w-48 rounded align-middle"
          tone={300}
          as="span"
        />
      </PageTitle>

      <div className="space-y-6">
        {/* SectionTitle placeholder */}
        <SkeletonBar className="h-7 w-32 rounded" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                {Array.from({ length: 4 }, (_, i) => (
                  <th key={i} className="py-2 px-2 sm:px-3">
                    <SkeletonBar className="h-4 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  {Array.from({ length: 4 }, (__, j) => (
                    <td key={j} className="py-2 px-2 sm:px-3">
                      <SkeletonBar className="h-4 w-20 rounded" />
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
