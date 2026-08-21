"use client";

import { type FormEvent, useState } from "react";
import {
  PROFILE_INPUT_CLASS,
  ProfileTextField,
} from "@/app/(user)/(protected)/_components/profile-text-field";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { SectionTitle } from "@/app/_components/section-title";

import { updateProfile } from "../_actions/update-profile";
import { PROFILE_LIMITS } from "../_lib/profile-validation";

/** action が返す既知のエラーキー（profileEdit 名前空間に対応する文言がある） */
const KNOWN_ERROR_KEYS = new Set([
  "displayNameTooLong",
  "bioTooLong",
  "xUsernameInvalid",
  "instagramUsernameInvalid",
  "youtubeHandleInvalid",
  "rateLimited",
  "updateFailed",
]);

export interface ProfileFormInitial {
  readonly displayName: string;
  readonly bio: string;
  readonly xUsername: string;
  readonly instagramUsername: string;
  readonly youtubeHandle: string;
}

/**
 * プロフィール（表示名・自己紹介・SNS）編集フォーム。アバターは別コンポーネント。
 * プロフィール編集フォーム
 */
export function ProfileForm({
  initial,
  showSkip,
}: {
  readonly initial: ProfileFormInitial;
  readonly showSkip: boolean;
}) {
  const t = useTranslations("profileEdit");
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [xUsername, setXUsername] = useState(initial.xUsername);
  const [instagramUsername, setInstagramUsername] = useState(
    initial.instagramUsername,
  );
  const [youtubeHandle, setYoutubeHandle] = useState(initial.youtubeHandle);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    try {
      const result = await updateProfile({
        displayName,
        bio,
        xUsername,
        instagramUsername,
        youtubeHandle,
      });

      if ("error" in result) {
        setError(
          KNOWN_ERROR_KEYS.has(result.error) ? t(result.error) : t("error"),
        );
        setIsSubmitting(false);
        return;
      }

      toast.success(t("success"));
      router.push("/mypage");
    } catch {
      setError(t("error"));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <SectionTitle>{t("basicSectionTitle")}</SectionTitle>

        <ProfileTextField
          id="displayName"
          label={t("displayNameLabel")}
          description={t("displayNameDescription")}
          value={displayName}
          onChange={setDisplayName}
          placeholder={t("displayNamePlaceholder")}
          maxLength={PROFILE_LIMITS.displayName}
        />

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-surface-800"
          >
            {t("bioLabel")}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("bioPlaceholder")}
            maxLength={PROFILE_LIMITS.bio}
            rows={4}
            className={PROFILE_INPUT_CLASS}
          />
          <p className="mt-1 text-right text-xs text-surface-400">
            {t("bioCounter", { count: bio.length, max: PROFILE_LIMITS.bio })}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>{t("snsSectionTitle")}</SectionTitle>

        <ProfileTextField
          id="xUsername"
          label={t("xLabel")}
          value={xUsername}
          onChange={setXUsername}
          placeholder={t("xPlaceholder")}
          maxLength={PROFILE_LIMITS.xUsername + 1}
        />

        <ProfileTextField
          id="instagramUsername"
          label={t("instagramLabel")}
          value={instagramUsername}
          onChange={setInstagramUsername}
          placeholder={t("instagramPlaceholder")}
          maxLength={PROFILE_LIMITS.instagramUsername + 1}
        />

        <ProfileTextField
          id="youtubeHandle"
          label={t("youtubeLabel")}
          value={youtubeHandle}
          onChange={setYoutubeHandle}
          placeholder={t("youtubePlaceholder")}
          maxLength={PROFILE_LIMITS.youtubeHandle + 1}
        />
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
        {showSkip && (
          <div className="text-center">
            <Link
              href="/mypage"
              className="text-sm text-surface-500 hover:underline"
            >
              {t("skip")}
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}
