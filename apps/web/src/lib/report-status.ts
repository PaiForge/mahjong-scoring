/**
 * 通報の対応の状態（`reports.status` の値）
 * 通報状態
 *
 * DB の CHECK・管理画面の操作と絞り込み・状態のチップが同じ文字列を使う。
 * 一覧のタブ（未対応 / 閉じたもの）は画面の区分で、この値とは別物。
 */
export const ReportStatus = {
  /** 未対応 */
  Open: "open",
  /** 対応済み（BAN・プロフィールの削除で閉じた） */
  Resolved: "resolved",
  /** 対応不要として閉じた */
  Dismissed: "dismissed",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/** 通報状態の一覧（CHECK の値と既知の状態の判定） */
export const REPORT_STATUSES: readonly ReportStatus[] =
  Object.values(ReportStatus);

/**
 * 文字列が通報状態の値か
 * 通報状態判定
 *
 * @param value - DB から読んだ状態
 */
export function isReportStatus(value: string): value is ReportStatus {
  return REPORT_STATUSES.some((status) => status === value);
}
