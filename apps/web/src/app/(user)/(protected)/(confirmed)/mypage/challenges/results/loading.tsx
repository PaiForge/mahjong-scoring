import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * チャレンジ全履歴のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-48" />
      </PageTitle>

      <div className="space-y-6">
        <SectionTitleSkeleton width="w-32" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-3 border-ink">
                {Array.from({ length: 4 }, (_, i) => (
                  <th key={i} className="py-2 px-2 sm:px-3">
                    <SkeletonBar className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr
                  key={i}
                  className="border-b-2 border-dashed border-border/40"
                >
                  {Array.from({ length: 4 }, (__, j) => (
                    <td key={j} className="py-2 px-2 sm:px-3">
                      <SkeletonBar className="h-4 w-20" />
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
