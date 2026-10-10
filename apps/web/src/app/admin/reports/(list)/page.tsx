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
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { isReportReason } from "@mahjong-scoring/features/reports/report";

import { formatAdminDateTime } from "../../_lib/format-date";
import { ReportStatusChip } from "../_components/report-status-chip";
import { countOpenReports, fetchReportsPageData } from "../_lib/queries";

const searchParamsCache = createSearchParamsCache({
  tab: parseAsStringLiteral(["open", "closed"] as const).withDefault("open"),
  page: parseAsInteger.withDefault(1),
});

/** 列（通報日時・通報された人・理由・通報した人・状態・操作） */
const COLUMN_KEYS = [
  "createdAt",
  "target",
  "reason",
  "reporter",
  "status",
  "actions",
] as const;

/** 1 時間（経過時間の表示に使う） */
const HOUR_MS = 60 * 60 * 1000;

/**
 * 通報一覧
 *
 * @description
 * 利用者が公開プロフィールから送った通報（`reports`）を、未対応 / 対応済みの
 * タブで並べる。未対応は古い順で、経過時間を添える（利用規約で 24 時間以内の
 * 確認を約束しているため）。対応は詳細ページで行う — 通報した時点の内容と
 * 今のプロフィールを見比べてから押す操作のため、一覧には置かない。
 * @flow 一覧（未対応）→ 詳細 → BAN / プロフィールを消す / 対応不要（理由を入れて確定）
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { tab, page } = await searchParamsCache.parse(searchParams);
  const [t, tReasons, data, openCount] = await Promise.all([
    getTranslations("admin.reports"),
    getTranslations("report.reasons"),
    fetchReportsPageData(tab, page),
    countOpenReports(),
  ]);
  const now = new Date();
  const username = (id: string | null) =>
    id === null ? "-" : (data.profileMap.get(id)?.username ?? id);
  const buildHref = (p: number) =>
    `/admin/reports?tab=${tab}&page=${String(p)}`;

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
            href: "/admin/reports",
            label: t("tabs.openWithCount", { count: openCount }),
            current: tab === "open",
          },
          {
            href: "/admin/reports?tab=closed",
            label: t("tabs.closed"),
            current: tab === "closed",
          },
        ]}
      />

      <div className="admin-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              {COLUMN_KEYS.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 font-medium whitespace-nowrap"
                >
                  {t(`table.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.reports.length === 0 ? (
              <TableEmptyRow
                columnCount={COLUMN_KEYS.length}
                label={t("table.empty")}
              />
            ) : (
              data.reports.map((report) => (
                <tr key={report.id} className="border-b border-surface-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatAdminDateTime(report.createdAt)}
                    {report.status === "open" && (
                      <span className="block text-xs text-surface-500">
                        {t("elapsed", {
                          hours: Math.floor(
                            (now.getTime() - report.createdAt.getTime()) /
                              HOUR_MS,
                          ),
                        })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">@{report.snapshot.username}</td>
                  <td className="px-4 py-3">
                    {isReportReason(report.reason)
                      ? tReasons(report.reason)
                      : report.reason}
                  </td>
                  <td className="px-4 py-3">{username(report.reporterId)}</td>
                  <td className="px-4 py-3">
                    <ReportStatusChip status={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reports/${report.id}`}
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
