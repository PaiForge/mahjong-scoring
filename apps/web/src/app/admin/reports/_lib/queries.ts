import "server-only";

import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import { db, profiles, reports, type Profile, type Report } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";

import { buildProfileMap } from "../../_lib/log-query-helpers";

/** 一覧のタブ（未対応 / 対応済み・対応不要） */
export type ReportListTab = "open" | "closed";

/** 通報一覧ページのデータ */
interface ReportsPageData {
  readonly reports: readonly Report[];
  readonly currentPage: number;
  readonly totalPages: number;
  /** 通報した人・された人・閉じた管理者を引ける */
  readonly profileMap: Map<string, Profile>;
}

/**
 * 通報一覧ページのデータを取得する
 * 通報一覧取得
 *
 * 未対応は古い順（24 時間の約束に近いものから片付ける）、閉じたものは
 * 閉じた順の新しい順に並べる。
 */
export async function fetchReportsPageData(
  tab: ReportListTab,
  page: number,
): Promise<ReportsPageData> {
  const where =
    tab === "open" ? eq(reports.status, "open") : ne(reports.status, "open");
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(where);
  const pagination = getPaginationData(
    page,
    countRow?.count ?? 0,
    DEFAULT_PAGE_SIZE,
  );
  const rows = await db
    .select()
    .from(reports)
    .where(where)
    .orderBy(tab === "open" ? asc(reports.createdAt) : desc(reports.resolvedAt))
    .limit(pagination.limit)
    .offset(pagination.offset);

  const userIds = [
    ...new Set(
      rows.flatMap((r) =>
        [r.reporterId, r.targetUserId, r.resolvedBy].filter(
          (id): id is string => id !== null,
        ),
      ),
    ),
  ];
  return {
    reports: rows,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap: await buildProfileMap(userIds),
  };
}

/**
 * 未対応の通報の件数
 * 未対応通報数
 *
 * ダッシュボードとナビゲーションに出し、溜まっていることに気づけるようにする。
 */
export async function countOpenReports(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));
  return row?.count ?? 0;
}

/** 通報の詳細ページのデータ */
interface ReportDetail {
  readonly report: Report;
  /** 通報された人の今のプロフィール */
  readonly target: Profile | undefined;
  /** 同じ人への他の通報（新しい順） */
  readonly otherReports: readonly Report[];
  readonly profileMap: Map<string, Profile>;
}

/**
 * 通報の詳細を取得する
 * 通報詳細取得
 */
export async function fetchReportDetail(
  id: string,
): Promise<ReportDetail | undefined> {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  if (!report) return undefined;
  const [[target], otherReports] = await Promise.all([
    db
      .select()
      .from(profiles)
      .where(eq(profiles.id, report.targetUserId))
      .limit(1),
    db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.targetUserId, report.targetUserId),
          ne(reports.id, report.id),
        ),
      )
      .orderBy(desc(reports.createdAt)),
  ]);
  const userIds = [
    ...new Set(
      [report, ...otherReports].flatMap((r) =>
        [r.reporterId, r.resolvedBy].filter(
          (userId): userId is string => userId !== null,
        ),
      ),
    ),
  ];
  return {
    report,
    target,
    otherReports,
    profileMap: await buildProfileMap(userIds),
  };
}
