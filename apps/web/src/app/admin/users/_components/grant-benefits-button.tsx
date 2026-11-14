"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";
import { ADMIN_INPUT_CLASSES } from "@/app/admin/_lib/input-classes";
import { BENEFIT_GRANT_MESSAGE_MAX_LENGTH } from "@mahjong-scoring/features/notifications/message";

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
 * Pro 付与ボタン — クリックでモーダル表示、期間・通知に出す文（任意）・理由を入れて付与
 * 特典付与ボタン
 */
export function GrantBenefitsButton({
  targetUserId,
}: GrantBenefitsButtonProps) {
  const t = useTranslations("admin.benefitGrants");
  const [duration, setDuration] = useState<GrantDurationKey>(DEFAULT_DURATION);
  const [message, setMessage] = useState("");
  const messageId = `grant-message-${targetUserId}`;

  return (
    <AdminReasonModal
      tone="primary"
      // 取り消しボタン（付与ごとに並ぶ）と同じく id を対象で分ける
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
        const result = await grantBenefits(
          targetUserId,
          duration,
          reason,
          message,
        );
        return !("error" in result);
      }}
      onReset={() => {
        setDuration(DEFAULT_DURATION);
        setMessage("");
      }}
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

      <label htmlFor={messageId} className="mb-1 block text-sm font-medium">
        {t("grant.messageLabel")}
      </label>
      <input
        id={messageId}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("grant.messagePlaceholder")}
        maxLength={BENEFIT_GRANT_MESSAGE_MAX_LENGTH}
        className={`w-full ${ADMIN_INPUT_CLASSES}`}
      />
      <p className="mt-1 mb-4 text-xs text-surface-500">
        {t("grant.messageHint")}
      </p>
    </AdminReasonModal>
  );
}
