"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthFormError } from "../../_components/auth-form-error";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import {
  AUTH_INPUT_CLASS,
  AuthTextField,
} from "../../_components/auth-text-field";
import { buildContactParams } from "../_lib/contact-params";
import { CONTACT_LIMITS, parseContactForm } from "@/lib/validations/contact";

/**
 * 問い合わせの入力フォーム
 * 問い合わせフォーム
 *
 * 送信はしない。検証を通ったら内容をクエリに載せて確認画面へ進む。
 * 確認画面の「入力画面に戻る」から戻ってきたときは、同じクエリで各欄を
 * 埋め直す（`useSearchParams()` を読むため、呼び出し側で Suspense に包む）。
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [message, setMessage] = useState(searchParams.get("message") ?? "");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseContactForm({ name, email, subject, message });
    if (!parsed.ok) {
      setError(t(`errors.${parsed.error}`));
      return;
    }
    setError(undefined);
    setIsNavigating(true);
    router.push(`/contact/confirm?${buildContactParams(parsed.value)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto space-y-4">
      <AuthFormError message={error} />

      <AuthTextField
        id="contact-name"
        label={t("form.name")}
        type="text"
        value={name}
        onChange={setName}
        autoComplete="name"
        maxLength={CONTACT_LIMITS.name}
      />

      <AuthTextField
        id="contact-email"
        label={t("form.email")}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder={t("form.emailPlaceholder")}
      />

      <AuthTextField
        id="contact-subject"
        label={t("form.subject")}
        type="text"
        value={subject}
        onChange={setSubject}
        autoComplete="off"
        maxLength={CONTACT_LIMITS.subject}
      />

      <div className="space-y-1">
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-surface-700"
        >
          {t("form.message")}
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={CONTACT_LIMITS.messageMin}
          maxLength={CONTACT_LIMITS.message}
          rows={8}
          className={`${AUTH_INPUT_CLASS} resize-y`}
        />
        <p className="text-right text-xs text-surface-400">
          {t("form.messageCounter", {
            count: message.length,
            max: CONTACT_LIMITS.message,
          })}
        </p>
      </div>

      <AuthSubmitButton loading={isNavigating}>
        {t("form.submit")}
      </AuthSubmitButton>
    </form>
  );
}
