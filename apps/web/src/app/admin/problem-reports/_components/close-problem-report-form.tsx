"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";
import { closeProblemReportAction } from "../_actions/problem-report-actions";
import {
  PROBLEM_REPORT_RESOLUTION_NOTE_MAX_LENGTH,
  type ClosedProblemReportStatus,
} from "../_lib/close-options";

/** 閉じ方ごとの押す色と文言のキー（並びは重い方から） */
const CLOSE_OPTIONS = [
  { status: "resolved", tone: "primary", labelKey: "resolve" },
  { status: "dismissed", tone: "secondary", labelKey: "dismiss" },
] as const satisfies readonly {
  readonly status: ClosedProblemReportStatus;
  readonly tone: "primary" | "secondary";
  readonly labelKey: string;
}[];

/**
 * 問題の報告を閉じるフォーム（メモ + 「修正済み」「問題なし」）
 * 問題報告クローズフォーム
 *
 * メモは任意なので、理由を必須にする管理画面の共通モーダル（`AdminReasonModal`）は
 * 使わず、詳細ページにそのまま置く。閉じると同じ問題の未対応の報告がまとめて閉じ、
 * Action の再検証でページが閉じた状態に描き直される。
 */
export function CloseProblemReportForm({
  reportId,
}: {
  readonly reportId: string;
}) {
  const t = useTranslations("admin.problemReports.close");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const close = (status: ClosedProblemReportStatus) => {
    setError(undefined);
    startTransition(async () => {
      const result = await closeProblemReportAction(reportId, status, note);
      // エラーの文言: admin.problemReports.close.errors.unauthorized / invalidInput / notFound / failed
      if ("error" in result) setError(t(`errors.${result.error}`));
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-surface-600">{t("description")}</p>
      <div>
        <label
          htmlFor="problem-report-note"
          className="mb-1.5 block text-sm font-medium text-surface-900"
        >
          {t("noteLabel")}
        </label>
        <textarea
          id="problem-report-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("notePlaceholder")}
          className={`w-full ${ADMIN_INPUT_CLASSES}`}
          rows={3}
          maxLength={PROBLEM_REPORT_RESOLUTION_NOTE_MAX_LENGTH}
          disabled={isPending}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {CLOSE_OPTIONS.map((option) => (
          <button
            key={option.status}
            type="button"
            disabled={isPending}
            onClick={() => close(option.status)}
            className={adminButtonClasses({ variant: option.tone, size: "sm" })}
          >
            {isPending ? t("pending") : t(option.labelKey)}
          </button>
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
