/**
 * 問題の報告を閉じる操作の入力の決まり（クライアントのフォームと Action で共有）
 *
 * フォーム（クライアント）からも読むので、DB に触れるモジュール
 * （`close-problem-reports.ts`。`server-only`）とは分けて置く。
 */
import { ProblemReportStatus } from "@/lib/problem-reports/status";

/** 閉じるときに選べる状態（未対応へは戻さない） */
export const CLOSED_PROBLEM_REPORT_STATUSES = [
  ProblemReportStatus.Resolved,
  ProblemReportStatus.Dismissed,
] as const;

/** 閉じるときに選べる状態（{@link CLOSED_PROBLEM_REPORT_STATUSES}） */
export type ClosedProblemReportStatus =
  (typeof CLOSED_PROBLEM_REPORT_STATUSES)[number];

/** 閉じたときの管理者のメモの最大長（入力欄の `maxLength` もここから引く） */
export const PROBLEM_REPORT_RESOLUTION_NOTE_MAX_LENGTH = 1000;
