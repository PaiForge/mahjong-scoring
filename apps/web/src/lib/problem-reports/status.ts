/**
 * 問題の報告の対応の状態（`problem_reports.status` の値）
 * 問題報告状態
 *
 * DB の CHECK・管理画面の操作と絞り込み・状態のチップが同じ文字列を使う。
 * 利用者の通報の状態（`lib/report-status.ts`）と同じ 3 つだが、表も操作も別物なので
 * 定数を共有しない（片方に状態を足しても、もう片方の CHECK が黙って変わらないように）。
 */
export const ProblemReportStatus = {
  /** 未対応 */
  Open: "open",
  /** 対応済み（正解・盤面の誤りを直した、または直すと決めた） */
  Resolved: "resolved",
  /** 対応不要として閉じた（正解は正しかった等） */
  Dismissed: "dismissed",
} as const;
export type ProblemReportStatus =
  (typeof ProblemReportStatus)[keyof typeof ProblemReportStatus];

/** 問題報告状態の一覧（CHECK の値と既知の状態の判定） */
export const PROBLEM_REPORT_STATUSES: readonly ProblemReportStatus[] =
  Object.values(ProblemReportStatus);

/**
 * 文字列が問題報告状態の値か
 * 問題報告状態判定
 *
 * @param value - DB から読んだ状態
 */
export function isProblemReportStatus(
  value: string,
): value is ProblemReportStatus {
  return PROBLEM_REPORT_STATUSES.some((status) => status === value);
}
