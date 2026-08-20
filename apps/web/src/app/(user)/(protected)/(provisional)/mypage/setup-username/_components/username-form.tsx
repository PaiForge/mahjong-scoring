"use client";

import { type FormEvent, useCallback, useState } from "react";
import { ProfileTextField } from "@/app/(user)/(protected)/_components/profile-text-field";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { validateUsername } from "@/lib/username";

import { registerUsername } from "../_actions/register-username";

/**
 * ユーザー名登録フォーム。
 * 初回ログイン後にユーザー名と表示名を設定する。
 *
 * ユーザー名セットアップフォーム
 */
export function UsernameForm() {
  const t = useTranslations("setupUsername");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getValidationMessage = useCallback(
    (errorKey: string): string => {
      switch (errorKey) {
        case "too_short":
          return t("validation.tooShort");
        case "too_long":
          return t("validation.tooLong");
        case "invalid_format":
          return t("validation.invalidFormat");
        case "reserved":
          return t("validation.reserved");
        case "username_taken":
          return t("validation.taken");
        case "username_already_set":
          return t("validation.alreadySet");
        case "rateLimited":
          return t("validation.rateLimited");
        case "unauthorized":
          return t("validation.unauthorized");
        default:
          return t("validation.error");
      }
    },
    [t],
  );

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (error) {
      setError(undefined);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setError(getValidationMessage(validationError));
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const result = await registerUsername(
        trimmedUsername,
        displayName.trim() || undefined,
      );

      if ("error" in result) {
        setError(getValidationMessage(result.error));
        setIsSubmitting(false);
        return;
      }

      // 本登録直後はプロフィール編集（アバター・自己紹介・SNS。任意）へ誘導する。
      router.push("/mypage/profile/edit?from=setup");
    } catch {
      setError(getValidationMessage("unknown"));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileTextField
        id="username"
        label={t("usernameLabel")}
        description={t("usernameDescription")}
        value={username}
        onChange={handleUsernameChange}
        placeholder={t("usernamePlaceholder")}
        maxLength={20}
        required
        autoFocus
      >
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          <li className="text-xs text-red-500">{t("cannotChange")}</li>
          <li className="text-xs text-surface-500">{t("usernameHint")}</li>
        </ul>
      </ProfileTextField>

      <ProfileTextField
        id="displayName"
        label={t("displayNameLabel")}
        description={t("displayNameDescription")}
        value={displayName}
        onChange={setDisplayName}
        placeholder={t("displayNamePlaceholder")}
        maxLength={50}
      >
        <ul className="mt-2 list-inside list-disc">
          <li className="text-xs text-surface-500">
            {t("displayNameCanChange")}
          </li>
          <li className="text-xs text-surface-500">
            {t("displayNameMaxLength")}
          </li>
        </ul>
      </ProfileTextField>

      <button
        type="submit"
        disabled={isSubmitting || username.trim().length === 0}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
