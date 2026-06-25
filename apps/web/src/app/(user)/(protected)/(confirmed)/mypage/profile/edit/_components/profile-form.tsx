"use client";

import { type FormEvent, useState } from "react";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { SectionTitle } from "@/app/_components/section-title";

import { updateProfile } from "../_actions/update-profile";
import { PROFILE_LIMITS } from "../_lib/profile-validation";

const inputClassName =
  "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none";

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

        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-surface-800"
          >
            {t("displayNameLabel")}
          </label>
          <p className="mb-2 text-xs text-surface-500">
            {t("displayNameDescription")}
          </p>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("displayNamePlaceholder")}
            maxLength={PROFILE_LIMITS.displayName}
            autoComplete="off"
            className={inputClassName}
          />
        </div>

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
            className={inputClassName}
          />
          <p className="mt-1 text-right text-xs text-surface-400">
            {t("bioCounter", { count: bio.length, max: PROFILE_LIMITS.bio })}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>{t("snsSectionTitle")}</SectionTitle>

        <div>
          <label
            htmlFor="xUsername"
            className="mb-1 block text-sm font-medium text-surface-800"
          >
            {t("xLabel")}
          </label>
          <input
            id="xUsername"
            type="text"
            value={xUsername}
            onChange={(e) => setXUsername(e.target.value)}
            placeholder={t("xPlaceholder")}
            maxLength={PROFILE_LIMITS.xUsername + 1}
            autoComplete="off"
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="instagramUsername"
            className="mb-1 block text-sm font-medium text-surface-800"
          >
            {t("instagramLabel")}
          </label>
          <input
            id="instagramUsername"
            type="text"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.target.value)}
            placeholder={t("instagramPlaceholder")}
            maxLength={PROFILE_LIMITS.instagramUsername + 1}
            autoComplete="off"
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="youtubeHandle"
            className="mb-1 block text-sm font-medium text-surface-800"
          >
            {t("youtubeLabel")}
          </label>
          <input
            id="youtubeHandle"
            type="text"
            value={youtubeHandle}
            onChange={(e) => setYoutubeHandle(e.target.value)}
            placeholder={t("youtubePlaceholder")}
            maxLength={PROFILE_LIMITS.youtubeHandle + 1}
            autoComplete="off"
            className={inputClassName}
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
