"use client";

import { useTranslations } from "next-intl";

import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";

import {
  banAndResolveReportAction,
  clearProfileAndResolveReportAction,
  dismissReportAction,
} from "../_actions/report-actions";

/** 3 つの対応の種類と、それぞれの見た目・処理 */
const ACTIONS = {
  ban: { tone: "danger", run: banAndResolveReportAction },
  clearProfile: { tone: "danger", run: clearProfileAndResolveReportAction },
  dismiss: { tone: "primary", run: dismissReportAction },
} as const;

/** 並び（重い対応から） */
const ACTION_KINDS = ["ban", "clearProfile", "dismiss"] as const;

/**
 * 通報への対応のボタン（BAN / プロフィールを消す / 対応不要）
 * 通報対応ボタン
 *
 * どれも理由を入れて確定する（`moderation_actions` に残る）。
 */
export function ReportActionButtons({
  reportId,
}: {
  readonly reportId: string;
}) {
  const t = useTranslations("admin.reports.actions");
  return (
    <div className="flex flex-wrap gap-3">
      {ACTION_KINDS.map((kind) => (
        <AdminReasonModal
          key={kind}
          tone={ACTIONS[kind].tone}
          reasonId={`report-${kind}-reason`}
          labels={{
            trigger: t(`${kind}.button`),
            title: t(`${kind}.title`),
            reasonLabel: t("reasonLabel"),
            reasonPlaceholder: t("reasonPlaceholder"),
            reasonRequired: t("errorReasonRequired"),
            failed: t(`${kind}.failed`),
            cancel: t("cancel"),
            confirm: t(`${kind}.confirm`),
            pending: t("pending"),
          }}
          onSubmit={async (reason) => {
            const result = await ACTIONS[kind].run(reportId, reason);
            return !("error" in result);
          }}
        />
      ))}
    </div>
  );
}
