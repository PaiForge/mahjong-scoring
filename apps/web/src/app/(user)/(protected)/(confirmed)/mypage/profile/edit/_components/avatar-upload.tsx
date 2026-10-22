"use client";

import { type ChangeEvent, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import Image from "next/image";
import toast from "react-hot-toast";

import { callApi } from "@/lib/api-client";
import { ConfirmationModal } from "@/app/(user)/_components/confirmation-modal";
import {
  FOCUS_RING_CLASSES,
  TEXT_LINK_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { XMarkIcon } from "@/app/(user)/_components/icons/x-mark-icon";
import { useAuth } from "@/app/_contexts/auth-context";
import {
  avatarRemoveErrorKey,
  avatarUploadErrorKey,
  prepareAvatarFile,
} from "../_lib/avatar-file";

/**
 * アバターアップロード。ファイル選択時に即アップロードし、表示を差し替える。
 * 画像がある間は右上にバツ印を重ね、確認モーダルを挟んで初期アイコンへ戻す。
 * アバターアップロード
 */
export function AvatarUpload({
  currentAvatarUrl,
}: {
  readonly currentAvatarUrl: string | null;
}) {
  const t = useTranslations("profileEdit");
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isUploading || isRemoving;

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;

    setError(null);
    const prepared = await prepareAvatarFile(original);
    if (!prepared.ok) {
      setError(t(prepared.error));
      resetInput();
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", prepared.file);

      const result = await callApi<{ avatarUrl: string }>(
        "/api/profile/avatar",
        { method: "POST", body: formData },
      );

      if (!result.ok) {
        setError(t(avatarUploadErrorKey(result.error)));
        return;
      }

      setAvatarUrl(result.data.avatarUrl);
      // ヘッダーのアバターも同じ画面内で差し替える（リロードを待たせない）
      void refreshProfile();
      toast.success(t("avatarUploaded"));
    } finally {
      setIsUploading(false);
      resetInput();
    }
  };

  const handleRemove = async () => {
    setIsRemoveModalOpen(false);
    setError(null);
    setIsRemoving(true);
    try {
      const result = await callApi("/api/profile/avatar", { method: "DELETE" });

      if (!result.ok) {
        setError(t(avatarRemoveErrorKey(result.error)));
        return;
      }

      setAvatarUrl(null);
      // ヘッダーのアバターも同じ画面内で初期アイコンへ戻す
      void refreshProfile();
      toast.success(t("avatarRemoved"));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/*
        バツ印はアバターの上に重ねるため、円（button）の内側には置けない
        （button の入れ子は不正な HTML になる）。位置合わせ用のラッパーで
        兄弟として並べる。
      */}
      <div className="relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className={`relative block h-24 w-24 overflow-hidden rounded-full border border-panel bg-surface-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed ${FOCUS_RING_CLASSES}`}
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
          {isBusy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          )}
        </button>

        {/*
          画像に重ねる削除バッジは、ボタンの体裁には乗せない（アップロード UI で見慣れた小さな丸のバツ印のほうが
          何をするボタンか一目で分かる）。白いリングは写真の上でも輪郭が
          消えないようにするためのもの。
        */}
        {avatarUrl && (
          <button
            type="button"
            onClick={() => setIsRemoveModalOpen(true)}
            disabled={isBusy}
            aria-label={t("avatarRemove")}
            title={t("avatarRemove")}
            className={`absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-700 text-white shadow-sm ring-2 ring-white transition-colors hover:bg-surface-900 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING_CLASSES}`}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy}
        className={`text-sm font-medium disabled:opacity-50 ${TEXT_LINK_CLASSES}`}
      >
        {t("avatarChange")}
      </button>

      <p className="text-xs text-surface-500">{t("avatarHint")}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemove}
        title={t("avatarRemoveConfirmTitle")}
        message={t("avatarRemoveConfirmMessage")}
        confirmText={t("avatarRemoveConfirmOk")}
        cancelText={t("avatarRemoveConfirmCancel")}
        confirmVariant="danger"
      />
    </div>
  );
}
