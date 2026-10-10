import { getTranslations } from "next-intl/server";

import { adminChipClasses, type AdminChipTone } from "../../_lib/chip-classes";

/** 状態の色（未対応 = 赤、対応済み = 緑、対応不要 = 灰） */
const STATUS_TONES: Readonly<Record<string, AdminChipTone>> = {
  open: "danger",
  resolved: "success",
  dismissed: "neutral",
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
  const known =
    status === "open" || status === "resolved" || status === "dismissed";
  return (
    <span className={adminChipClasses(STATUS_TONES[status] ?? "neutral")}>
      {known ? t(status) : status}
    </span>
  );
}
