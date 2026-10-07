import { getTranslations } from "next-intl/server";

import type { BenefitGrant, Profile } from "@/lib/db";
import {
  benefitGrantStateOf,
  type BenefitGrantState,
} from "@/lib/billing/plan-status";

import { formatAdminDate } from "../../_lib/format-date";
import { resolveUserDisplay } from "../../_lib/log-query-helpers";

import { RevokeGrantButton } from "./revoke-grant-button";
import { adminChipClasses, type AdminChipTone } from "../../_lib/chip-classes";

interface BenefitGrantRowProps {
  readonly grant: BenefitGrant;
  readonly now: Date;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

/** 状態バッジの色（有効 = 緑、期限切れ = 灰、取り消し = 赤） */
const STATE_CHIP_TONES: Readonly<Record<BenefitGrantState, AdminChipTone>> = {
  active: "success",
  expired: "neutral",
  revoked: "danger",
};

/**
 * 特典付与一覧の 1 行
 * 付与行
 */
export async function BenefitGrantRow({
  grant,
  now,
  profileMap,
  emailMap,
}: BenefitGrantRowProps) {
  const t = await getTranslations("admin.benefitGrants");
  const state = benefitGrantStateOf(grant, now);

  return (
    <tr className="border-t border-surface-200">
      <td className="px-4 py-3">
        {resolveUserDisplay(grant.userId, profileMap, emailMap)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {grant.plan === "pro" ? t("plan.pro") : grant.plan}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-surface-500">
        {formatAdminDate(grant.startsAt)}
        {" 〜 "}
        {grant.expiresAt
          ? formatAdminDate(grant.expiresAt)
          : t("table.permanent")}
      </td>
      <td className="px-4 py-3">
        <span title={grant.reason}>
          {grant.reason.length > 50
            ? `${grant.reason.slice(0, 50)}...`
            : grant.reason}
        </span>
        {grant.revokeReason && (
          <span className="mt-1 block text-xs text-surface-500">
            {t("table.revokedReason", { reason: grant.revokeReason })}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-surface-500">
        {resolveUserDisplay(grant.grantedBy, profileMap, emailMap)}
      </td>
      <td className="px-4 py-3">
        <span className={adminChipClasses(STATE_CHIP_TONES[state])}>
          {t(`state.${state}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        {state === "active" && <RevokeGrantButton grantId={grant.id} />}
      </td>
    </tr>
  );
}
