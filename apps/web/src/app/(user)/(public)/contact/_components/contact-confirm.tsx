"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { AuthFormError } from "../../_components/auth-form-error";
import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
import { sendContactMail } from "../_actions/send-contact-mail";
import { buildContactParams } from "../_lib/contact-params";
import { Button } from "@/app/(user)/_components/button";
import { LinkButton } from "@/app/(user)/_components/link-button";
import type { ContactFormData } from "@/lib/validations/contact";

interface ContactConfirmProps {
  readonly formData: ContactFormData;
}

/**
 * 問い合わせ内容の確認と送信
 * 問い合わせ確認
 *
 * 内容は表示だけのカード（太枠・影なし）に並べる。「入力画面に戻る」は
 * 同じ内容をクエリに載せて入力画面へ戻り、「送信する」で Server Action を
 * 呼んで完了画面へ進む。
 */
export function ContactConfirm({ formData }: ContactConfirmProps) {
  const t = useTranslations("contact");
  const router = useRouter();
  const { error, isLoading, submit } = useAuthFormSubmit();

  const handleSend = () => {
    void submit({
      action: () => sendContactMail(formData),
      mapError: (code) => t(`errors.${code}`),
      onSuccess: () => {
        router.push("/contact/success");
      },
    });
  };

  const rows = [
    { label: t("form.name"), value: formData.name },
    { label: t("form.email"), value: formData.email },
    { label: t("form.subject"), value: formData.subject },
    { label: t("form.message"), value: formData.message },
  ] as const;

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <p className="text-sm text-surface-500">{t("confirm.description")}</p>

      <AuthFormError message={error} />

      <dl className="space-y-4 rounded-lg border-3 border-ink bg-surface-50 p-4">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium text-surface-500">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-surface-800">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <LinkButton
          href={`/contact?${buildContactParams(formData)}`}
          variant="neutral"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {t("form.backToForm")}
        </LinkButton>
        <Button
          type="button"
          onClick={handleSend}
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? t("form.sending") : t("form.send")}
        </Button>
      </div>
    </div>
  );
}
