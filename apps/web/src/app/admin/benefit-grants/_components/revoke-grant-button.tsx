"use client";

import { useTranslations } from "next-intl";

import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";

import { revokeBenefitGrantAction } from "../_actions/revoke-benefit-grant";

interface RevokeGrantButtonProps {
  readonly grantId: string;
}

/**
 * 付与の取り消しボタン — クリックでモーダル表示、理由入力後に取り消す
 * 付与取り消しボタン
 */
export function RevokeGrantButton({ grantId }: RevokeGrantButtonProps) {
  const t = useTranslations("admin.benefitGrants.revoke");

  return (
    <AdminReasonModal
      tone="danger"
      reasonId={`revoke-reason-${grantId}`}
      labels={{
        trigger: t("button"),
        title: t("title"),
        description: t("description"),
        reasonLabel: t("reasonLabel"),
        reasonPlaceholder: t("reasonPlaceholder"),
        reasonRequired: t("errorReasonRequired"),
        failed: t("errorFailed"),
        cancel: t("cancel"),
        confirm: t("confirm"),
        pending: t("pending"),
      }}
      onSubmit={async (reason) => {
        const result = await revokeBenefitGrantAction(grantId, reason);
        return !("error" in result);
      }}
    />
  );
}
