"use client";

import { type ChangeEvent, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import Image from "next/image";
import toast from "react-hot-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * アバターアップロード。ファイル選択時に即アップロードし、表示を差し替える。
 * アバターアップロード
 */
export function AvatarUpload({
  currentAvatarUrl,
}: {
  readonly currentAvatarUrl: string | null;
}) {
  const t = useTranslations("profileEdit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("avatarInvalidType"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("avatarTooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          data.error === "tooLarge"
            ? t("avatarTooLarge")
            : data.error === "invalidType" || data.error === "invalidImage"
              ? t("avatarInvalidType")
              : t("avatarUploadFailed"),
        );
        return;
      }

      const { avatarUrl: newUrl } = (await res.json()) as {
        avatarUrl: string;
      };
      setAvatarUrl(newUrl);
      toast.success(t("avatarUploaded"));
    } catch {
      setError(t("avatarUploadFailed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="relative h-24 w-24 overflow-hidden rounded-full border border-surface-200 bg-surface-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
        aria-label={t("avatarChange")}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={t("avatarAlt")}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-surface-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-12 w-12"
              aria-hidden="true"
            >
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          </span>
        )}
        {isUploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {t("avatarChange")}
      </button>
      <p className="text-xs text-surface-500">{t("avatarHint")}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
