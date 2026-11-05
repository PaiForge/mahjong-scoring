import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import {
  LogFilterSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/table-skeleton";

import { USER_TABLE_COLUMNS } from "../_lib/table-columns";

/**
 * ユーザー管理のローディング状態
 * ローディング
 *
 * route group `(list)` は、この index の loading.tsx が兄弟ルート（`[id]`）の
 * 祖先にならないようにするためだけにある。不変条件（動的ルートは loading.tsx を 1 枚・
 * 静的ルートは 0 枚）と理由は `apps/web/src/app/loading-boundaries.test.ts`。page.tsx と
 * loading.tsx を 1 つ上に移すとそのテストが落ちる。
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitlePlaceholder width="w-32" />
      <LogFilterSkeleton fields={1} />
      <TableSkeleton columns={USER_TABLE_COLUMNS.length} />
    </div>
  );
}
