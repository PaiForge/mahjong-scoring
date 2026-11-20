import { getTranslations } from "next-intl/server";

import {
  isProblemReportStatus,
  ProblemReportStatus,
} from "@/lib/problem-reports/status";

import { adminChipClasses, type AdminChipTone } from "../../_lib/chip-classes";

/** 状態の色（未対応 = 赤、修正済み = 緑、問題なし = 灰） */
const STATUS_TONES: Readonly<Record<ProblemReportStatus, AdminChipTone>> = {
  [ProblemReportStatus.Open]: "danger",
  [ProblemReportStatus.Resolved]: "success",
  [ProblemReportStatus.Dismissed]: "neutral",
};

/**
 * 問題の報告の状態のチップ
 * 問題報告状態チップ
 */
export async function ProblemReportStatusChip({
  status,
}: {
  readonly status: string;
}) {
  const t = await getTranslations("admin.problemReports.status");
  if (!isProblemReportStatus(status)) {
    return <span className={adminChipClasses("neutral")}>{status}</span>;
  }
  return (
    <span className={adminChipClasses(STATUS_TONES[status])}>{t(status)}</span>
  );
}
