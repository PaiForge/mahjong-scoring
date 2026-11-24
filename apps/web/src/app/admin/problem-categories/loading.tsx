import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ARCHIVE_KINDS } from "@mahjong-scoring/core";
import {
  PROBLEM_VALUE_CATEGORIES,
  PROBLEM_CATEGORY_GROUPS,
  NAMED_PROBLEM_CATEGORIES,
} from "@mahjong-scoring/features/problem-facets/categories";

import { RULE_FLAGS } from "./_lib/rule-flags";

/**
 * 問題の分類のローディング状態
 * ローディング
 *
 * 実体（タイトル → 説明 → 網羅の表とボタン → 属性別の表 → 名前付き条件の表 → ルールで変わる
 * 問題の表）の構造・余白に合わせて CLS を防ぐ。該当する問題の一覧は分類を選んだときだけ
 * 出るので含めない。表の行数は定数から決まる。
 */
export default function AdminProblemCategoriesLoading() {
  return (
    <>
      <AdminPageTitlePlaceholder width="w-40" className="mb-2" />
      <div className="mb-6 space-y-1">
        <SkeletonBar className="h-5 w-full max-w-2xl" tone={100} />
        <SkeletonBar className="h-5 w-2/3 max-w-md" tone={100} />
      </div>

      <div className="space-y-6">
        {/* 網羅の状況（種別 + 合計の行）とボタン */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="mb-4 h-5 w-2/3 max-w-xl" tone={100} />
          <TableSkeleton columns={5} rows={ARCHIVE_KINDS.length + 1} />
          <SkeletonBar className="mt-4 h-9 w-36" />
        </section>

        {/* 分類ごとの問題数 */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="mb-4 h-5 w-2/3 max-w-xl" tone={100} />
          <div className="space-y-6">
            {PROBLEM_CATEGORY_GROUPS.map((group) => (
              <div key={group}>
                <SkeletonBar className="mb-3 h-6 w-32" />
                <TableSkeleton
                  columns={2 + ARCHIVE_KINDS.length}
                  rows={
                    PROBLEM_VALUE_CATEGORIES.filter(
                      (category) => category.group === group,
                    ).length
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* 名前付き条件 */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="mb-4 h-5 w-2/3 max-w-xl" tone={100} />
          <TableSkeleton
            columns={2 + ARCHIVE_KINDS.length}
            rows={NAMED_PROBLEM_CATEGORIES.length}
          />
        </section>

        {/* ルールで変わる問題 */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="mb-4 h-5 w-2/3 max-w-xl" tone={100} />
          <TableSkeleton
            columns={2 + ARCHIVE_KINDS.length}
            rows={RULE_FLAGS.length}
          />
        </section>
      </div>
    </>
  );
}
