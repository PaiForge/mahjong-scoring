import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/** 読み込み中に並べる行数。件数はデータが来るまで分からないので控えめに置く */
const PLACEHOLDER_ROWS = 5;

/**
 * お知らせ（一覧 / 詳細）の読み込み中スケルトン
 *
 * 一覧（`AnnouncementTextList`）と同じ細枠の面に `min-h-16` の行を並べる。
 * 詳細ページもこの境界の下にあるが、入口の大半は一覧からの遷移なので一覧の
 * 形に合わせている。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-32" />

      <div className="space-y-4">
        <SectionTitleSkeleton width="w-32" />
        <ul
          aria-hidden="true"
          className="divide-y divide-surface-100 overflow-hidden rounded-panel border border-panel"
        >
          {Array.from({ length: PLACEHOLDER_ROWS }).map((_, i) => (
            <li
              key={i}
              className="flex min-h-16 items-center gap-3 px-4 py-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-5">
                <SkeletonBar className="h-3 w-20 shrink-0" tone={100} />
                <SkeletonBar className="h-4 w-56 max-w-full" tone={100} />
              </div>
              <SkeletonBar className="size-4 shrink-0" tone={100} />
            </li>
          ))}
        </ul>
      </div>
    </ContentContainer>
  );
}
