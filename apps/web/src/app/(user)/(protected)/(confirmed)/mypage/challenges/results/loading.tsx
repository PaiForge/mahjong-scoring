import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import {
  CHALLENGE_RESULTS_COLUMNS,
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "../_components/compact-table";

/**
 * 実物（{@link ResultsTable}）の列と同じ寄せ。正解数・ミス数は右寄せなので、
 * 帯も右端へ寄せる。左寄せの帯を 4 本並べると、データが届いた瞬間に数値が
 * 列の反対側へ飛ぶ
 */
const RESULTS_COLUMN_ALIGNS = ["left", "left", "right", "right"] as const;

/**
 * チャレンジ全履歴のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-48" />

      <div className="space-y-6">
        <SectionTitleSkeleton width="w-32" />

        <CompactTable
          columns={CHALLENGE_RESULTS_COLUMNS}
          head={RESULTS_COLUMN_ALIGNS.map((align, i) => (
            <CompactTableHeaderCell key={i} align={align}>
              <SkeletonBar
                className={`h-4 w-12 ${align === "right" ? "ml-auto" : ""}`}
              />
            </CompactTableHeaderCell>
          ))}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <CompactTableRow key={i}>
              {RESULTS_COLUMN_ALIGNS.map((align, j) => (
                <CompactTableCell key={j} align={align}>
                  <SkeletonBar
                    className={
                      align === "right" ? "ml-auto h-4 w-8" : "h-4 w-20"
                    }
                  />
                </CompactTableCell>
              ))}
            </CompactTableRow>
          ))}
        </CompactTable>
      </div>
    </ContentContainer>
  );
}
