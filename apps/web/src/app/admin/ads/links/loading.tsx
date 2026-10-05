import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";

export default function Loading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <AdminPageTitlePlaceholder />
        <SkeletonBar className="h-5 w-96 max-w-full" tone={100} />
        <SkeletonBar className="h-5 w-32" tone={100} />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <section key={i} className="admin-panel space-y-3 p-4">
            <SkeletonBar className="h-6 w-56 max-w-full" />
            <SkeletonBar className="h-4 w-72 max-w-full" tone={100} />
            <SkeletonBar className="h-[38px] w-full" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBar className="h-8 w-32" />
              <SkeletonBar className="h-8 w-32" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
