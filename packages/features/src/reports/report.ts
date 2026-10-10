/**
 * 利用者による通報の定義（理由・詳細の検証）
 * 通報定義
 *
 * web の公開プロフィールの通報フォームが選択肢を出し、Server Action が同じ
 * 規則で検証する。理由のキーは DB（`reports.reason`）・辞書
 * （`report.reasons.<key>`）で同じ文字列を使う。アプリは通報の入口を持たない
 * （他の利用者を見せないため）。
 */

/**
 * 通報の理由（並びは選択肢の並び）
 *
 * 「その他」だけは詳細の記入が必須（何が問題かが理由から読めないため）。
 */
export const REPORT_REASONS = [
  "inappropriate_profile",
  "harassment",
  "impersonation",
  "spam",
  "cheating",
  "other",
] as const;

/** 通報の理由（{@link REPORT_REASONS}） */
export type ReportReason = (typeof REPORT_REASONS)[number];

/** 詳細の最大長（入力欄の `maxLength` もここから引く） */
export const REPORT_DETAIL_MAX_LENGTH = 500;

const reportReasonSet: ReadonlySet<string> = new Set(REPORT_REASONS);

/** 値が通報の理由かを判定する型ガード */
export function isReportReason(value: unknown): value is ReportReason {
  return typeof value === "string" && reportReasonSet.has(value);
}

/** 通報の入力の誤り（辞書の `report.errors.<key>` と対応する） */
export const REPORT_INPUT_ERRORS = [
  "invalidReason",
  "detailRequired",
  "detailTooLong",
] as const;

/** 通報の入力の誤り（{@link REPORT_INPUT_ERRORS}） */
export type ReportInputError = (typeof REPORT_INPUT_ERRORS)[number];

/** 検証済みの通報の入力（詳細は前後の空白を除き、空なら null） */
export interface ReportInput {
  readonly reason: ReportReason;
  readonly detail: string | null;
}

/**
 * 通報の入力を検証する
 * 通報入力検証
 *
 * クライアント（送る前の案内）とサーバー（信頼境界）の両方で使う。
 */
export function validateReportInput(
  reason: unknown,
  detail: unknown,
):
  | { readonly ok: true; readonly value: ReportInput }
  | { readonly ok: false; readonly error: ReportInputError } {
  if (!isReportReason(reason)) return { ok: false, error: "invalidReason" };
  const trimmed = typeof detail === "string" ? detail.trim() : "";
  if (trimmed.length > REPORT_DETAIL_MAX_LENGTH) {
    return { ok: false, error: "detailTooLong" };
  }
  if (reason === "other" && trimmed === "") {
    return { ok: false, error: "detailRequired" };
  }
  return { ok: true, value: { reason, detail: trimmed || null } };
}
