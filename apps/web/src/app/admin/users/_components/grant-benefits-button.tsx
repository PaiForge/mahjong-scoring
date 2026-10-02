"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";

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
  const [duration, setDuration] = useState<GrantDurationKey>(DEFAULT_DURATION);

  return (
    <AdminReasonModal
      tone="primary"
      // 行ごとに 1 つ描画されるので、取り消しボタンと同じく id を対象で分ける
      reasonId={`grant-reason-${targetUserId}`}
      labels={{
        trigger: t("grant.button"),
        title: t("grant.title"),
        description: t("grant.description"),
        reasonLabel: t("grant.reasonLabel"),
        reasonPlaceholder: t("grant.reasonPlaceholder"),
        reasonRequired: t("grant.errorReasonRequired"),
        failed: t("grant.errorFailed"),
        cancel: t("grant.cancel"),
        confirm: t("grant.confirm"),
        pending: t("grant.pending"),
      }}
      onSubmit={async (reason) => {
        const result = await grantBenefits(targetUserId, duration, reason);
        return !("error" in result);
      }}
      onReset={() => setDuration(DEFAULT_DURATION)}
    >
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
    </AdminReasonModal>
  );
}
