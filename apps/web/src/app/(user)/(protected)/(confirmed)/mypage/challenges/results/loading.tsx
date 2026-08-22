import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "../_components/compact-table";

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

        <CompactTable
          head={Array.from({ length: 4 }, (_, i) => (
            <CompactTableHeaderCell key={i}>
              <SkeletonBar className="h-4 w-16" />
            </CompactTableHeaderCell>
          ))}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <CompactTableRow key={i}>
              {Array.from({ length: 4 }, (__, j) => (
                <CompactTableCell key={j}>
                  <SkeletonBar className="h-4 w-20" />
                </CompactTableCell>
              ))}
            </CompactTableRow>
          ))}
        </CompactTable>
      </div>
    </ContentContainer>
  );
}
