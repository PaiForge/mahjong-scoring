import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";

export default function Loading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <SkeletonBar className="h-5 w-28" />
      <div className="flex flex-wrap items-center gap-3">
        <AdminPageTitlePlaceholder width="w-48" />
        <SkeletonBar className="h-6 w-16" />
        <SkeletonBar className="h-6 w-20" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[9, 4].map((rows) => (
          <section key={rows} className="admin-panel space-y-3 p-5">
            <SkeletonBar className="h-5 w-28" />
            <div>
              {Array.from({ length: rows }, (_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-0.5 border-t border-gray-100 py-2 first:border-t-0 sm:flex-row sm:gap-4"
                >
                  <SkeletonBar className="h-5 w-36 shrink-0" tone={100} />
                  <SkeletonBar className="h-5 w-32 max-w-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <section key={i} className="admin-panel space-y-3 p-5">
          <SkeletonBar className="h-5 w-28" />
          <SkeletonBar className="h-5 w-48" tone={100} />
        </section>
      ))}
    </div>
  );
}
