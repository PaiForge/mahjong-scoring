import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { AdminPageTitlePlaceholder } from "./admin-page-title";

function Field({ multiline = false }: { readonly multiline?: boolean }) {
  return (
    <div>
      <SkeletonBar className="mb-1 h-5 w-24" tone={100} />
      <SkeletonBar
        className={multiline ? "h-[338px] w-full" : "h-[38px] w-full"}
      />
    </div>
  );
}

/** 作成・編集では一覧の表ではなく、実際の入力フォームの配置を表示する。 */
export function AnnouncementEditorSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <AdminPageTitlePlaceholder />
      <div className="admin-panel max-w-3xl space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-0 flex-1">
            <Field />
          </div>
          <div className="w-32">
            <Field />
          </div>
        </div>
        <Field />
        <Field multiline />
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Field />
          </div>
          <div className="min-w-0 flex-1">
            <Field />
          </div>
        </div>
        <SkeletonBar className="h-5 w-48" />
        <div className="flex gap-3 pt-2">
          <SkeletonBar className="h-[38px] w-24" />
          <SkeletonBar className="h-[38px] w-28" tone={100} />
        </div>
      </div>
    </div>
  );
}

export function AdEditorSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <AdminPageTitlePlaceholder />
      <div className="admin-panel max-w-3xl space-y-5 p-5 sm:p-7">
        <div>
          <SkeletonBar className="mb-1 h-5 w-24" tone={100} />
          <SkeletonBar className="h-5 w-56 max-w-full" />
        </div>
        {[0, 1].map((i) => (
          <div key={i}>
            <Field />
            <SkeletonBar className="mt-1 h-4 w-64 max-w-full" tone={100} />
          </div>
        ))}
        <div className="flex flex-wrap gap-4">
          <div className="w-24">
            <Field />
          </div>
          <div className="min-w-0 flex-1">
            <Field />
          </div>
        </div>
        <SkeletonBar className="h-4 w-64 max-w-full" tone={100} />
        <div className="space-y-3 rounded-lg border border-surface-200 p-4">
          <SkeletonBar className="h-5 w-28" />
          <Field />
          <div>
            <SkeletonBar className="mb-1 h-5 w-24" tone={100} />
            <SkeletonBar className="h-24 w-full" />
          </div>
        </div>
        <SkeletonBar className="h-5 w-48" />
        <div className="flex gap-3 pt-2">
          <SkeletonBar className="h-[38px] w-24" />
          <SkeletonBar className="h-[38px] w-28" tone={100} />
        </div>
      </div>
    </div>
  );
}
