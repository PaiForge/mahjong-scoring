import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsStringLiteral,
} from "nuqs/server";

import { AdminPaginationNav } from "@/app/admin/_components/admin-pagination-nav";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { AdminTabs } from "@/app/admin/_components/admin-tabs";
import { TableEmptyRow } from "@/app/admin/_components/table-empty-row";
import { TableHead } from "@/app/admin/_components/table-head";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import { formatAdminDateTime } from "../../_lib/format-date";
import { ProblemReportStatusChip } from "../_components/problem-report-status-chip";
import { isKnownContext, isKnownKind, isKnownReason } from "../_lib/labels";
import {
  countOpenProblemReports,
  fetchProblemReportsPageData,
} from "../_lib/queries";
import { PROBLEM_REPORT_TABLE_COLUMNS } from "../_lib/table-columns";

const searchParamsCache = createSearchParamsCache({
  tab: parseAsStringLiteral(["open", "closed"] as const).withDefault("open"),
  page: parseAsInteger.withDefault(1),
});

/**
 * 問題の報告一覧
 *
 * @description
 * 利用者が出題された問題（和了形・聴牌形の点数計算、本日の問題）の正解や盤面の
 * 誤りを知らせた報告（`problem_reports`）を、未対応 / 閉じたもののタブで並べる。
 * 未対応は古い順、閉じたものは閉じた順の新しい順。同じ問題への未対応の件数を
 * 添え、同じ問題に報告が重なっているものから見られるようにする。閉じる操作は
 * 詳細ページにだけ置く — 報告時の正解と現在の正解を見比べてから押す操作のため。
 * @flow 一覧（未対応）→ 詳細 → 正解を見比べる → 「修正済み」/「問題なし」で閉じる
 */
export default async function AdminProblemReportsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { tab, page } = await searchParamsCache.parse(searchParams);
  const [t, tReasons, data, openCount] = await Promise.all([
    getTranslations("admin.problemReports"),
    getTranslations("problemReport.reasons"),
    fetchProblemReportsPageData(tab, page),
    countOpenProblemReports(),
  ]);
  const username = (id: string | null) =>
    id === null
      ? t("report.deletedUser")
      : (data.profileMap.get(id)?.username ?? id);
  const buildHref = (p: number) =>
    `/admin/problem-reports?tab=${tab}&page=${String(p)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitle>{t("listTitle")}</AdminPageTitle>
        <p className="text-sm text-surface-600">{t("listDescription")}</p>
      </div>

      <AdminTabs
        label={t("tabsLabel")}
        tabs={[
          {
            href: "/admin/problem-reports",
            label: t("tabs.openWithCount", { count: openCount }),
            current: tab === "open",
          },
          {
            href: "/admin/problem-reports?tab=closed",
            label: t("tabs.closed"),
            current: tab === "closed",
          },
        ]}
      />

      <div className="admin-table">
        <table className="w-full text-left text-sm">
          <TableHead
            labels={PROBLEM_REPORT_TABLE_COLUMNS.map((key) =>
              t(`table.${key}`),
            )}
          />
          <tbody>
            {data.rows.length === 0 ? (
              <TableEmptyRow
                columnCount={PROBLEM_REPORT_TABLE_COLUMNS.length}
                label={t("table.empty")}
              />
            ) : (
              data.rows.map(({ report, kind, openCountForProblem }) => (
                <tr key={report.id} className="border-b border-surface-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatAdminDateTime(report.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {/* 辞書キーの例: admin.problemReports.kinds.agari-score */}
                    {isKnownKind(kind) ? t(`kinds.${kind}`) : kind}
                  </td>
                  <td className="px-4 py-3">
                    {/* 辞書キーの例: admin.problemReports.contexts.daily-problem */}
                    {isKnownContext(report.context)
                      ? t(`contexts.${report.context}`)
                      : report.context}
                  </td>
                  <td className="px-4 py-3">
                    {isKnownReason(report.reason)
                      ? tReasons(report.reason)
                      : report.reason}
                  </td>
                  <td className="px-4 py-3">{username(report.reporterId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t("openCount", { count: openCountForProblem })}
                  </td>
                  <td className="px-4 py-3">
                    <ProblemReportStatusChip status={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/problem-reports/${report.id}`}
                      className={TEXT_LINK_CLASSES}
                    >
                      {t("table.detail")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPaginationNav
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
