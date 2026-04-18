import { ContentContainer } from '@/app/_components/content-container';

export default function LeaderboardDetailLoading() {
  return (
    <ContentContainer className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-100" />
      <div className="h-5 w-32 animate-pulse rounded bg-surface-100" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 animate-pulse rounded bg-surface-100" />
          <div className="h-8 w-32 animate-pulse rounded bg-surface-100" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-surface-100" />
        ))}
      </div>
    </ContentContainer>
  );
}
