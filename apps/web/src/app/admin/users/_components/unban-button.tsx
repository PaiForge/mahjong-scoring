"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { AdminModalShell } from "@/app/admin/_components/admin-modal-shell";

import { unbanUser } from "../_actions/unban-user";
import { adminButtonClasses } from "../../_lib/button-classes";

interface UnbanButtonProps {
  readonly targetUserId: string;
}

/**
 * BAN 解除ボタン — クリックで確認モーダル表示後に BAN 解除を実行
 * BAN解除ボタン
 */
export function UnbanButton({ targetUserId }: UnbanButtonProps) {
  const t = useTranslations("admin");
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined) => {
      const result = await unbanUser(targetUserId);
      if ("error" in result) {
        return { error: t("unbanUser.errorFailed") };
      }
      setIsOpen(false);
      return undefined;
    },
    undefined,
  );

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={adminButtonClasses({ size: "sm" })}
      >
        {t("unbanUser.confirm")}
      </button>

      <AdminModalShell
        isOpen={isOpen}
        onClose={close}
        label={t("unbanUser.title")}
      >
        <h3 className="text-lg font-semibold">{t("unbanUser.title")}</h3>
        <p className="text-sm text-surface-600">
          {t("unbanUser.confirmMessage")}
        </p>

        <form action={formAction}>
          {state?.error && (
            <p className="mb-3 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className={adminButtonClasses({ variant: "secondary" })}
            >
              {t("unbanUser.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={adminButtonClasses()}
            >
              {isPending ? t("unbanUser.pending") : t("unbanUser.confirm")}
            </button>
          </div>
        </form>
      </AdminModalShell>
    </>
  );
}
