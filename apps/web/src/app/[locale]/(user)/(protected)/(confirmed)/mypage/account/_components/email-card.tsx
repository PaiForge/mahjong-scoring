"use client";

import { useId, useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { Button } from "@/app/[locale]/(user)/_components/button";
import { PROFILE_INPUT_CLASS } from "@/app/[locale]/(user)/(protected)/_components/profile-text-field";
import { ACCOUNT_PAGE_PATH } from "@/lib/users/account-page-notice";
import { requestEmailChange } from "../_actions/request-email-change";
import type { RequestEmailChangeError } from "../_actions/request-email-change";

interface EmailCardProps {
  readonly email: string | undefined;
  /** 変更を始めて確認が終わっていない新しいアドレス */
  readonly pendingEmail: string | undefined;
  /**
   * 今のアドレスが Apple の「メールを非公開」の中継アドレスで、確認メールが
   * 届かない（変更もパスワードの設定もできない）
   */
  readonly relayBlocked: boolean;
}

/**
 * アカウントのメールアドレスのカード
 * メールアドレスカード
 *
 * 今のアドレスと「変更する」。押すと同じカードの中に新しいアドレスの入力が
 * 開く（別のページもモーダルも挟まない）。送ると認証サーバーが変更前・変更後の
 * 両方に確認メールを送り、両方のリンクを開くまでアドレスは変わらない。
 * 送った後は URL の報せを消しつつ読み直し、「確認しています」の行を出す。
 */
export function EmailCard({
  email,
  pendingEmail,
  relayBlocked,
}: EmailCardProps) {
  const t = useTranslations("mypageAccount.email");
  const router = useRouter();
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapError = (code: RequestEmailChangeError | "unknown"): string => {
    switch (code) {
      case "invalidEmail":
      case "sameEmail":
      case "emailUnavailable":
      case "relayAddress":
      case "rateLimited":
      case "sendFailed":
      case "unauthorized":
      case "banned":
        return t(`errors.${code}`);
      case "unknown":
        return t("errors.sendFailed");
      default: {
        const exhaustive: never = code;
        return exhaustive;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await requestEmailChange(newEmail);
      if ("error" in result) {
        setError(mapError(result.error));
        return;
      }
      toast.success(t("sentToast"));
      setEditing(false);
      setNewEmail("");
      router.replace(ACCOUNT_PAGE_PATH);
    } catch {
      setError(mapError("unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-panel border border-panel bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 break-all text-sm font-medium text-foreground">
          {email ?? "—"}
        </p>
        {!editing && (
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={relayBlocked}
            className="shrink-0"
          >
            {t("change")}
          </Button>
        )}
      </div>

      {pendingEmail !== undefined && (
        <p role="status" className="text-xs leading-relaxed text-surface-600">
          {t("pending", { email: pendingEmail })}
        </p>
      )}
      {relayBlocked && (
        <p className="text-xs leading-relaxed text-surface-500">
          {t("relayBlocked")}
        </p>
      )}

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-panel pt-4"
        >
          <div>
            <label
              htmlFor={inputId}
              className="mb-1 block text-sm font-medium text-surface-800"
            >
              {t("newEmailLabel")}
            </label>
            <input
              id={inputId}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t("newEmailPlaceholder")}
              required
              maxLength={254}
              autoComplete="email"
              autoFocus
              className={PROFILE_INPUT_CLASS}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setEditing(false);
                setNewEmail("");
                setError("");
              }}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
