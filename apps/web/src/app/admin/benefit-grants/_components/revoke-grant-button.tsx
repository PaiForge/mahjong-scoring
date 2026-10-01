"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { AdminModalShell } from "@/app/admin/_components/admin-modal-shell";

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
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined) => {
      const trimmed = reason.trim();
      if (trimmed.length === 0) {
        return { error: t("errorReasonRequired") };
      }
      const result = await revokeBenefitGrantAction(grantId, trimmed);
      if ("error" in result) {
        return { error: t("errorFailed") };
      }
      setIsOpen(false);
      setReason("");
      return undefined;
    },
    undefined,
  );

  const close = () => {
    setIsOpen(false);
    setReason("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
      >
        {t("button")}
      </button>

      <AdminModalShell isOpen={isOpen} onClose={close} label={t("title")}>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>

        <form action={formAction}>
          <label
            htmlFor={`revoke-reason-${grantId}`}
            className="mb-1 block text-sm font-medium"
          >
            {t("reasonLabel")}
          </label>
          <textarea
            id={`revoke-reason-${grantId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            maxLength={1000}
          />

          {state?.error && (
            <p className="mb-3 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? t("pending") : t("confirm")}
            </button>
          </div>
        </form>
      </AdminModalShell>
    </>
  );
}
