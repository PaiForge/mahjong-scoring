import "server-only";

import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import {
  dailyProblems,
  db,
  practiceProblems,
  problemReports,
  type PracticeProblem,
  type Profile,
  type ProblemReport,
} from "@/lib/db";
import { DEFAULT_PAGE_SIZE, resolvePagination } from "@/lib/pagination";
import { ProblemReportStatus } from "@/lib/problem-reports/status";

import { buildProfileMap } from "../../_lib/log-query-helpers";

/** 一覧のタブ（未対応 / 閉じたもの） */
export type ProblemReportListTab = "open" | "closed";

/** 一覧の 1 行（報告 + 問題の種別 + 同じ問題の未対応の件数） */
export interface ProblemReportListRow {
  readonly report: ProblemReport;
  /** 報告された問題の種別（`practice_problems.kind`） */
  readonly kind: string;
  /** 同じ問題への未対応の報告の件数（この行を含む） */
  readonly openCountForProblem: number;
}

/** 問題の報告の一覧ページのデータ */
interface ProblemReportsPageData {
  readonly rows: readonly ProblemReportListRow[];
  readonly currentPage: number;
  readonly totalPages: number;
  /** 報告した人・閉じた管理者を引ける */
  readonly profileMap: Map<string, Profile>;
}

/** 報告した人・閉じた管理者の id（重複なし） */
function userIdsOf(reports: readonly ProblemReport[]): string[] {
  return [
    ...new Set(
      reports.flatMap((r) =>
        [r.reporterId, r.resolvedBy].filter((id): id is string => id !== null),
      ),
    ),
  ];
}

/**
 * 問題の報告の一覧ページのデータを取得する
 * 問題報告一覧取得
 *
 * 未対応は古い順（溜まっているものから片付ける）、閉じたものは閉じた順の
 * 新しい順に並べる（利用者の通報の一覧と同じ）。
 */
export async function fetchProblemReportsPageData(
  tab: ProblemReportListTab,
  page: number,
): Promise<ProblemReportsPageData> {
  const where =
    tab === "open"
      ? eq(problemReports.status, ProblemReportStatus.Open)
      : ne(problemReports.status, ProblemReportStatus.Open);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(problemReports)
    .where(where);
  const pagination = resolvePagination(
    page,
    countRow?.count ?? 0,
    DEFAULT_PAGE_SIZE,
  );
  const openCounts = db
    .select({
      problemId: problemReports.problemId,
      count: sql<number>`count(*)::int`.as("open_count"),
    })
    .from(problemReports)
    .where(eq(problemReports.status, ProblemReportStatus.Open))
    .groupBy(problemReports.problemId)
    .as("open_counts");
  const rows = await db
    .select({
      report: problemReports,
      kind: practiceProblems.kind,
      openCountForProblem: sql<number>`coalesce(${openCounts.count}, 0)::int`,
    })
    .from(problemReports)
    .innerJoin(
      practiceProblems,
      eq(practiceProblems.id, problemReports.problemId),
    )
    .leftJoin(openCounts, eq(openCounts.problemId, problemReports.problemId))
    .where(where)
    .orderBy(
      tab === "open"
        ? asc(problemReports.createdAt)
        : desc(problemReports.resolvedAt),
    )
    .limit(pagination.limit)
    .offset(pagination.offset);

  return {
    rows,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap: await buildProfileMap(userIdsOf(rows.map((r) => r.report))),
  };
}

/**
 * 未対応の問題の報告の件数
 * 未対応問題報告数
 *
 * 一覧の「未対応」タブに出し、溜まっていることに気づけるようにする。
 */
export async function countOpenProblemReports(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(problemReports)
    .where(eq(problemReports.status, ProblemReportStatus.Open));
  return row?.count ?? 0;
}

/** 問題の報告の詳細ページのデータ */
interface ProblemReportDetail {
  readonly report: ProblemReport;
  /** 報告された問題（盤面） */
  readonly problem: PracticeProblem;
  /** 同じ問題への他の報告（新しい順） */
  readonly otherReports: readonly ProblemReport[];
  /** 本日の問題として出した日（JST の `YYYY-MM-DD`。新しい順） */
  readonly dailyProblemDays: readonly string[];
  readonly profileMap: Map<string, Profile>;
}

/**
 * 問題の報告の詳細を取得する
 * 問題報告詳細取得
 */
export async function fetchProblemReportDetail(
  id: string,
): Promise<ProblemReportDetail | undefined> {
  const [row] = await db
    .select({ report: problemReports, problem: practiceProblems })
    .from(problemReports)
    .innerJoin(
      practiceProblems,
      eq(practiceProblems.id, problemReports.problemId),
    )
    .where(eq(problemReports.id, id))
    .limit(1);
  if (!row) return undefined;
  const { report, problem } = row;
  const [otherReports, days] = await Promise.all([
    db
      .select()
      .from(problemReports)
      .where(
        and(
          eq(problemReports.problemId, report.problemId),
          ne(problemReports.id, report.id),
        ),
      )
      .orderBy(desc(problemReports.createdAt)),
    db
      .select({ day: dailyProblems.day })
      .from(dailyProblems)
      .where(eq(dailyProblems.problemId, report.problemId))
      .orderBy(desc(dailyProblems.day)),
  ]);
  return {
    report,
    problem,
    otherReports,
    dailyProblemDays: days.map((d) => d.day),
    profileMap: await buildProfileMap(userIdsOf([report, ...otherReports])),
  };
}
