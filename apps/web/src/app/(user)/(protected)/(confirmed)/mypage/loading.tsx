import { ContentContainer } from "@/app/_components/content-container";

/**
 * マイページのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      <div className="h-8 w-40 mb-6 bg-surface-200 rounded animate-pulse" />

      <div className="mt-6 rounded-lg border border-surface-200 bg-surface-50 p-5">
        <div className="h-6 w-32 mb-4 bg-surface-200 rounded animate-pulse" />
        <div className="h-[140px] w-full bg-surface-200 rounded animate-pulse" />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 rounded-lg border border-surface-200 bg-surface-50 animate-pulse" />
      </div>
    </ContentContainer>
  );
}
