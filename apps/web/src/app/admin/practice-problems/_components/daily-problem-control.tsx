"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";
import { setDailyProblemVisibility } from "../_actions/set-daily-problem-visibility";

/** 本日の問題の公開状態を、理由を残して切り替える。 */
export function DailyProblemControl({
  day,
  withheldReason,
}: {
  readonly day: string;
  readonly withheldReason: string | null;
}) {
  const t = useTranslations("admin.dailyProblem");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2 border-t border-surface-200 pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            const result = await setDailyProblemVisibility({
              day,
              hidden: !withheldReason,
              reason,
            });
            // admin.dailyProblem.saved / admin.dailyProblem.saveFailed
            setMessage("error" in result ? t("saveFailed") : t("saved"));
            if (!("error" in result)) setReason("");
          } catch {
            setMessage(t("saveFailed"));
          }
        });
      }}
    >
      <p className="text-sm font-semibold">
        {day} — {withheldReason ? t("hidden") : t("published")}
      </p>
      {withheldReason && (
        <p className="text-sm text-surface-600">{withheldReason}</p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {t("reason")}
          <input
            required
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            className={ADMIN_INPUT_CLASSES}
          />
        </label>
        <button
          type="submit"
          disabled={pending || !reason.trim()}
          className={adminButtonClasses({
            variant: withheldReason ? "primary" : "danger",
          })}
        >
          {withheldReason ? t("restore") : t("withhold")}
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
