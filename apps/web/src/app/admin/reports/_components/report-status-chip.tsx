import { getTranslations } from "next-intl/server";

import { isReportStatus, ReportStatus } from "@/lib/report-status";

import { adminChipClasses, type AdminChipTone } from "../../_lib/chip-classes";

/** 状態の色（未対応 = 赤、対応済み = 緑、対応不要 = 灰） */
const STATUS_TONES: Readonly<Record<ReportStatus, AdminChipTone>> = {
  [ReportStatus.Open]: "danger",
  [ReportStatus.Resolved]: "success",
  [ReportStatus.Dismissed]: "neutral",
};

/**
 * 通報の状態のチップ
 * 通報状態チップ
 */
export async function ReportStatusChip({
  status,
}: {
  readonly status: string;
}) {
  const t = await getTranslations("admin.reports.status");
  if (!isReportStatus(status)) {
    return <span className={adminChipClasses("neutral")}>{status}</span>;
  }
  return (
    <span className={adminChipClasses(STATUS_TONES[status])}>{t(status)}</span>
  );
}
