"use client";

import { useTranslations } from "next-intl";

import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";

import { banUser } from "../_actions/ban-user";

interface BanButtonProps {
  readonly targetUserId: string;
}

/**
 * BAN ボタン — クリックでモーダル表示、理由入力後に BAN 実行
 * BANボタン
 */
export function BanButton({ targetUserId }: BanButtonProps) {
  const t = useTranslations("admin");

  return (
    <AdminReasonModal
      tone="danger"
      reasonId="ban-reason"
      labels={{
        trigger: t("banUser.button"),
        title: t("banUser.title"),
        reasonLabel: t("banUser.reasonLabel"),
        reasonPlaceholder: t("banUser.reasonPlaceholder"),
        reasonRequired: t("banUser.errorReasonRequired"),
        failed: t("banUser.errorFailed"),
        cancel: t("banUser.cancel"),
        confirm: t("banUser.confirm"),
        pending: t("banUser.pending"),
      }}
      onSubmit={async (reason) => {
        const result = await banUser(targetUserId, reason);
        return !("error" in result);
      }}
    />
  );
}
