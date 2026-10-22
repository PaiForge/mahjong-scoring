"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { callApi } from "@/lib/api-client";

/**
 * 広告の画像を選んだ時点で `/api/admin/ads/image` へ送り、公開 URL を得る
 * 広告画像アップロード
 *
 * 失敗はトーストで知らせ、undefined を返す。
 */
export function useAdImageUpload(): {
  readonly isUploading: boolean;
  readonly upload: (file: File) => Promise<string | undefined>;
} {
  const t = useTranslations("admin.ads");
  const [isUploading, setIsUploading] = useState(false);
  const upload = async (file: File): Promise<string | undefined> => {
    setIsUploading(true);
    const body = new FormData();
    body.set("file", file);
    const result = await callApi<{ url: string }>("/api/admin/ads/image", {
      method: "POST",
      body,
    });
    setIsUploading(false);
    if (!result.ok) {
      toast.error(t("errorUploadFailed"));
      return undefined;
    }
    return result.data.url;
  };
  return { isUploading, upload };
}
