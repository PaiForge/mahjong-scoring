"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { AdminModalShell } from "@/app/admin/_components/admin-modal-shell";

import { grantBenefits } from "../_actions/grant-benefits";
import {
  GRANT_DURATION_KEYS,
  type GrantDurationKey,
} from "../_lib/grant-durations";

interface GrantBenefitsButtonProps {
  readonly targetUserId: string;
}

/** 既定の期間（選択肢の先頭 = 30 日） */
const DEFAULT_DURATION: GrantDurationKey = GRANT_DURATION_KEYS[0];

/**
 * Pro 付与ボタン — クリックでモーダル表示、期間と理由を入れて付与
 * 特典付与ボタン
 */
export function GrantBenefitsButton({
  targetUserId,
}: GrantBenefitsButtonProps) {
  const t = useTranslations("admin.benefitGrants");
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState<GrantDurationKey>(DEFAULT_DURATION);
  const [reason, setReason] = useState("");

  const reset = () => {
    setDuration(DEFAULT_DURATION);
    setReason("");
  };

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined) => {
      const trimmed = reason.trim();
      if (trimmed.length === 0) {
        return { error: t("grant.errorReasonRequired") };
      }
      const result = await grantBenefits(targetUserId, duration, trimmed);
      if ("error" in result) {
        return { error: t("grant.errorFailed") };
      }
      setIsOpen(false);
      reset();
      return undefined;
    },
    undefined,
  );

  const close = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
      >
        {t("grant.button")}
      </button>

      <AdminModalShell isOpen={isOpen} onClose={close} label={t("grant.title")}>
        <h3 className="text-lg font-semibold">{t("grant.title")}</h3>
        <p className="text-sm text-gray-600">{t("grant.description")}</p>

        <form action={formAction}>
          <fieldset className="mb-4">
            <legend className="mb-1 block text-sm font-medium">
              {t("grant.durationLabel")}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {GRANT_DURATION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="duration"
                    value={key}
                    checked={duration === key}
                    onChange={() => setDuration(key)}
                  />
                  {t(`durations.${key}`)}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 行ごとに 1 つ描画されるので、取り消しボタンと同じく id を対象で分ける */}
          <label
            htmlFor={`grant-reason-${targetUserId}`}
            className="mb-1 block text-sm font-medium"
          >
            {t("grant.reasonLabel")}
          </label>
          <textarea
            id={`grant-reason-${targetUserId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("grant.reasonPlaceholder")}
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
              {t("grant.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? t("grant.pending") : t("grant.confirm")}
            </button>
          </div>
        </form>
      </AdminModalShell>
    </>
  );
}
