"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { AdminChoiceTiles } from "@/app/admin/_components/admin-choice-tiles";
import { AdminReasonModal } from "@/app/admin/_components/admin-reason-modal";
import { adminChipClasses } from "@/app/admin/_lib/chip-classes";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import { ADMIN_INPUT_CLASSES } from "@/app/admin/_lib/input-classes";
import {
  BENEFIT_GRANT_CATEGORIES,
  type BenefitGrantCategory,
} from "@/lib/entitlements/benefit-grant-categories";
import { addPassDuration } from "@mahjong-scoring/features/billing/plans";
import {
  BENEFIT_GRANT_BODY_MAX_LENGTH,
  BENEFIT_GRANT_TITLE_MAX_LENGTH,
} from "@mahjong-scoring/features/notifications/message";

import { adminButtonClasses } from "@/app/admin/_lib/button-classes";

import { grantBenefits } from "../_actions/grant-benefits";
import { GRANT_TEMPLATES } from "../_lib/grant-templates";
import {
  GRANT_DURATION_DAYS,
  GRANT_DURATION_KEYS,
  type GrantDurationKey,
} from "../_lib/grant-durations";

interface GrantBenefitsButtonProps {
  readonly targetUserId: string;
}

/** 既定の期間（選択肢の先頭 = 30 日） */
const DEFAULT_DURATION: GrantDurationKey = GRANT_DURATION_KEYS[0];

/**
 * モーダルの中の 1 区画（見出し + 必須 / 任意の印 + 補足 + 入力欄）
 *
 * 入力欄が「何を付与するか」「本人に何を伝えるか」の 2 つの話に分かれるので、
 * 区切り線と見出しで組を示す。
 */
function FormSection({
  title,
  badge,
  description,
  children,
}: {
  readonly title: string;
  readonly badge: { readonly label: string; readonly required: boolean };
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="border-b border-surface-200 pb-6">
      <div className="mb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
          {title}
          <span
            className={adminChipClasses(badge.required ? "warning" : "neutral")}
          >
            {badge.label}
          </span>
        </h4>
        {description && (
          <p className="mt-1 text-xs text-surface-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** 入力欄の下の補足と、右端の「今の文字数 / 上限」 */
function FieldFooter({
  hint,
  length,
  maxLength,
}: {
  readonly hint: string;
  readonly length: number;
  readonly maxLength: number;
}) {
  return (
    <div className="mt-1 flex items-start justify-between gap-3 text-xs text-surface-500">
      <p>{hint}</p>
      <p className="shrink-0 tabular-nums">
        {length} / {maxLength}
      </p>
    </div>
  );
}

/**
 * Pro 付与ボタン — クリックでモーダル表示、付与の内容（種別・期間）・本人への通知（任意）・理由を入れて付与
 * 特典付与ボタン
 *
 * 種別には既定を置かない。先頭を選んだ状態で開くと、選び直さずに送った付与が
 * すべて先頭の種別になり、後からの集計が信用できなくなる。未選択のまま送ると
 * ブラウザの必須の検証（ラジオの `required`）が止める。
 *
 * 選んだ種別にテンプレート（`grant-templates.ts`）があり、通知のタイトルと本文が
 * どちらも空のときだけ、通知の欄に文面を入れるボタンを出す。片方でも書いてあれば
 * 出さない（書きかけを上書きしない）。押すと期間もテンプレートの値にそろえる。
 *
 * 期間のタイルには、いま付与したときの期限の日付を添える。「90 日」が何日までかを
 * 暗算させないため（数え方はサーバーと同じ `addPassDuration`。日付の境目をまたぐ
 * 数秒の差は出うるので、目安として出す）。
 */
export function GrantBenefitsButton({
  targetUserId,
}: GrantBenefitsButtonProps) {
  const t = useTranslations("admin.benefitGrants");
  const [duration, setDuration] = useState<GrantDurationKey>(DEFAULT_DURATION);
  const [category, setCategory] = useState<BenefitGrantCategory>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const titleId = `grant-notice-title-${targetUserId}`;
  const bodyId = `grant-notice-body-${targetUserId}`;
  // モーダルを開いている間は動かさない（押すたびに日付が変わって見えないように）
  const [now] = useState(() => new Date());

  const template =
    category === undefined ? undefined : GRANT_TEMPLATES[category];
  const showTemplate =
    category !== undefined &&
    template !== undefined &&
    title.trim() === "" &&
    body.trim() === "";

  return (
    <AdminReasonModal
      tone="primary"
      size="wide"
      // 取り消しボタン（付与ごとに並ぶ）と同じく id を対象で分ける
      reasonId={`grant-reason-${targetUserId}`}
      labels={{
        trigger: t("grant.button"),
        title: t("grant.title"),
        description: t("grant.description"),
        reasonLabel: t("grant.reasonLabel"),
        reasonPlaceholder: t("grant.reasonPlaceholder"),
        failed: t("grant.errorFailed"),
        cancel: t("grant.cancel"),
        confirm: t("grant.confirm"),
        pending: t("grant.pending"),
      }}
      onSubmit={async (reason) => {
        // 未選択は `required` が止めるので、ここに来るのは検証を外した送信だけ
        if (category === undefined) return false;
        const result = await grantBenefits(
          targetUserId,
          duration,
          category,
          reason,
          { title, body },
        );
        return !("error" in result);
      }}
      onReset={() => {
        setDuration(DEFAULT_DURATION);
        setCategory(undefined);
        setTitle("");
        setBody("");
      }}
    >
      <FormSection
        title={t("grant.sectionGrant")}
        badge={{ label: t("grant.required"), required: true }}
      >
        <AdminChoiceTiles
          name="category"
          legend={t("grant.categoryLabel")}
          columns={3}
          required
          value={category}
          onChange={setCategory}
          options={BENEFIT_GRANT_CATEGORIES.map((key) => ({
            key,
            // 例: admin.benefitGrants.categories.earlyAdopter
            label: t(`categories.${key}`),
            // 例: admin.benefitGrants.categoryHints.earlyAdopter
            hint: t(`categoryHints.${key}`),
          }))}
        />
        <AdminChoiceTiles
          name="duration"
          legend={t("grant.durationLabel")}
          columns={4}
          value={duration}
          onChange={setDuration}
          options={GRANT_DURATION_KEYS.map((key) => {
            const days = GRANT_DURATION_DAYS[key];
            return {
              key,
              // 例: admin.benefitGrants.durations.days30
              label: t(`durations.${key}`),
              hint: (
                // 日付の途中で折り返さない
                <span className="whitespace-nowrap">
                  {days === undefined
                    ? t("grant.noExpiry")
                    : t("grant.expiresOn", {
                        date: formatAdminDate(addPassDuration(now, days)),
                      })}
                </span>
              ),
            };
          })}
        />
      </FormSection>

      <FormSection
        title={t("grant.sectionNotice")}
        badge={{ label: t("grant.optional"), required: false }}
        description={t("grant.sectionNoticeDescription")}
      >
        {showTemplate && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => {
                setDuration(template.duration);
                // 例: admin.benefitGrants.templates.earlyAdopter.title
                setTitle(t(`templates.${category}.title`));
                setBody(t(`templates.${category}.body`));
              }}
              className={adminButtonClasses({
                variant: "secondary",
                size: "sm",
              })}
            >
              {t("grant.applyTemplate", {
                // 例: admin.benefitGrants.templates.earlyAdopter.label
                name: t(`templates.${category}.label`),
              })}
            </button>
            <p className="text-xs text-surface-500">
              {t("grant.applyTemplateHint", {
                // 例: admin.benefitGrants.durations.permanent
                duration: t(`durations.${template.duration}`),
              })}
            </p>
          </div>
        )}
        <div>
          <label
            htmlFor={titleId}
            className="mb-1.5 block text-sm font-medium text-surface-900"
          >
            {t("grant.noticeTitleLabel")}
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("grant.noticeTitlePlaceholder")}
            maxLength={BENEFIT_GRANT_TITLE_MAX_LENGTH}
            className={`w-full ${ADMIN_INPUT_CLASSES}`}
          />
          <FieldFooter
            hint={t("grant.noticeTitleHint")}
            length={title.length}
            maxLength={BENEFIT_GRANT_TITLE_MAX_LENGTH}
          />
        </div>

        <div>
          <label
            htmlFor={bodyId}
            className="mb-1.5 block text-sm font-medium text-surface-900"
          >
            {t("grant.noticeBodyLabel")}
          </label>
          <textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("grant.noticeBodyPlaceholder")}
            maxLength={BENEFIT_GRANT_BODY_MAX_LENGTH}
            rows={4}
            className={`w-full ${ADMIN_INPUT_CLASSES}`}
          />
          <FieldFooter
            hint={t("grant.noticeBodyHint")}
            length={body.length}
            maxLength={BENEFIT_GRANT_BODY_MAX_LENGTH}
          />
        </div>
      </FormSection>
    </AdminReasonModal>
  );
}
