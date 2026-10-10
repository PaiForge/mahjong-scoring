"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { reportUserAction } from "@/app/(user)/_actions/reports";
import { PROFILE_INPUT_CLASS } from "@/app/(user)/(protected)/_components/profile-text-field";
import { Button } from "@/app/(user)/_components/button";
import { ModalShell } from "@/app/_components/modal-shell";
import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASONS,
  validateReportInput,
  type ReportReason,
} from "@mahjong-scoring/features/reports/report";
import {
  SELECTED_TILE_CLASSES,
  UNSELECTED_TILE_CLASSES,
} from "@/app/(user)/_components/_lib/selection-classes";

/**
 * 公開プロフィールの「通報する」
 * 通報ボタン
 *
 * 押すと理由（`REPORT_REASONS`）と詳細を書くダイアログを開く。理由を選ぶまで
 * 送れず、「その他」は詳細が要る（`validateReportInput`。サーバーも同じ規則で
 * 検証する）。送った後に通報したことは画面に残さない — 同じ人へ重ねて
 * 送っても、サーバーが未対応の 1 件にまとめる。
 */
export function ReportButton({ username }: { readonly username: string }) {
  const t = useTranslations("report");
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | undefined>(undefined);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setIsOpen(false);
    setReason(undefined);
    setDetail("");
    setError(undefined);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = validateReportInput(reason, detail);
    if (!input.ok) {
      setError(t(`errors.${input.error}`, { max: REPORT_DETAIL_MAX_LENGTH }));
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await reportUserAction(
        username,
        input.value.reason,
        detail,
      );
      if ("error" in result) {
        setError(t("errors.failed"));
        return;
      }
      close();
      toast.success(t("doneToast"));
    });
  };

  return (
    <>
      <Button variant="neutral" size="sm" onClick={() => setIsOpen(true)}>
        {t("button")}
      </Button>
      <ModalShell isOpen={isOpen} onClose={close} labelledBy={titleId}>
        <form onSubmit={submit} className="space-y-4">
          <h3 id={titleId} className="text-xl font-bold text-surface-900">
            {t("title", { username })}
          </h3>
          <p className="text-sm leading-relaxed text-surface-700">
            {t("lead")}
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-surface-900">
              {t("reasonLabel")}
            </legend>
            {REPORT_REASONS.map((key) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-surface-800 ${
                  reason === key
                    ? SELECTED_TILE_CLASSES
                    : UNSELECTED_TILE_CLASSES
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={key}
                  checked={reason === key}
                  onChange={() => setReason(key)}
                  className="accent-selected"
                />
                {t(`reasons.${key}`)}
              </label>
            ))}
          </fieldset>
          <div>
            <label
              htmlFor="report-detail"
              className="mb-1 block text-sm font-medium text-surface-900"
            >
              {reason === "other" ? t("detailLabelRequired") : t("detailLabel")}
            </label>
            <textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t("detailPlaceholder")}
              maxLength={REPORT_DETAIL_MAX_LENGTH}
              rows={3}
              className={PROFILE_INPUT_CLASS}
            />
          </div>
          {error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="neutral" type="button" onClick={close}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={reason === undefined || isPending}
            >
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
