"use client";

import { type FormEvent, useCallback, useState } from "react";
import { ProfileTextField } from "@/app/(user)/(protected)/_components/profile-text-field";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import {
  generateUsername,
  USERNAME_MAX_LENGTH,
  validateUsername,
} from "@mahjong-scoring/features/account/username";
import { PROFILE_LIMITS } from "@mahjong-scoring/features/profile/validation";

import { registerUsername } from "../_actions/register-username";
import { usernameValidationMessageKey } from "../_lib/username-validation-message";
import { Button } from "@/app/(user)/_components/button";

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
    (errorKey: Parameters<typeof usernameValidationMessageKey>[0]): string =>
      t(usernameValidationMessageKey(errorKey)),
    [t],
  );

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (error) {
      setError(undefined);
    }
  };

  const handleGenerateUsername = () => {
    handleUsernameChange(generateUsername());
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

      // 本登録はここで完結する。着地はダッシュボード（ログイン済みの「/」。
      // proxy が /dashboard へ rewrite する）で、「次にやること」が最初の一歩を
      // 示す。プロフィール（アバター・自己紹介・SNS）は任意なのでここでは
      // 挟まず、マイページからいつでも編集できるままにする — 登録の直後に
      // 任意のフォームが続くと「まだ登録の続き」に見え、最初の学習までの
      // 距離が伸びる。
      const next = "/";
      toastOnArrival(next, t("registered"), "success");
      router.push(next);
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
        value={username}
        onChange={handleUsernameChange}
        placeholder={t("usernamePlaceholder")}
        maxLength={USERNAME_MAX_LENGTH}
        required
        autoFocus
        labelAction={
          <button
            type="button"
            onClick={handleGenerateUsername}
            className={`text-xs ${TEXT_LINK_CLASSES}`}
          >
            {t("generateUsername")}
          </button>
        }
      >
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          <li className="text-xs text-destructive">{t("cannotChange")}</li>
          <li className="text-xs text-surface-500">{t("usernameHintChars")}</li>
          <li className="text-xs text-surface-500">{t("usernameHintEdges")}</li>
        </ul>
      </ProfileTextField>

      <ProfileTextField
        id="displayName"
        label={t("displayNameLabel")}
        value={displayName}
        onChange={setDisplayName}
        placeholder={t("displayNamePlaceholder")}
        maxLength={PROFILE_LIMITS.displayName}
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

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={isSubmitting || username.trim().length === 0}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
