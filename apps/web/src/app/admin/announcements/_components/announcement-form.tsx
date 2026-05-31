"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { SUPPORTED_LOCALES } from "@/i18n/locales";

import { createAnnouncement } from "../_actions/create-announcement";
import { updateAnnouncement } from "../_actions/update-announcement";

export interface AnnouncementFormDefaults {
  slug: string;
  title: string;
  content: string;
  locale: string;
  status: string;
  publishedAt: string | null;
  pinned: boolean;
}

interface Props {
  readonly mode: "create" | "edit";
  readonly announcementId?: string;
  readonly defaultValues?: AnnouncementFormDefaults;
  readonly defaultSlug?: string;
  readonly defaultLocale?: string;
  readonly lockSlug?: boolean;
}

/** Date / ISO 文字列を datetime-local 入力値（ローカルタイム）に変換 */
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function AnnouncementForm({
  mode,
  announcementId,
  defaultValues,
  defaultSlug,
  defaultLocale,
  lockSlug = false,
}: Props) {
  const router = useRouter();
  const t = useTranslations("admin.announcements");
  const [isPending, startTransition] = useTransition();

  const [slug, setSlug] = useState(defaultValues?.slug ?? defaultSlug ?? "");
  const [locale, setLocale] = useState(
    defaultValues?.locale ?? defaultLocale ?? SUPPORTED_LOCALES[0],
  );
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [content, setContent] = useState(defaultValues?.content ?? "");
  const [status, setStatus] = useState(defaultValues?.status ?? "draft");
  const [publishedAtLocal, setPublishedAtLocal] = useState(
    toDatetimeLocal(defaultValues?.publishedAt),
  );
  const [pinned, setPinned] = useState(defaultValues?.pinned ?? false);

  const handleStatusChange = (next: string) => {
    setStatus(next);
    if (next === "published" && publishedAtLocal === "") {
      setPublishedAtLocal(toDatetimeLocal(new Date().toISOString()));
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const data = {
        slug: slug.trim(),
        title: title.trim(),
        content,
        locale,
        status,
        publishedAt: publishedAtLocal ? new Date(publishedAtLocal).toISOString() : null,
        pinned,
      };

      const result =
        mode === "edit" && announcementId
          ? await updateAnnouncement(announcementId, data)
          : await createAnnouncement(data);

      if ("error" in result) {
        toast.error(t(result.error));
        return;
      }

      toast.success(t(mode === "edit" ? "updatedToast" : "createdToast"));
      router.push("/admin/announcements");
      router.refresh();
    });
  };

  const inputClass =
    "w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-surface-700">
            {t("slug")}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t("slugPlaceholder")}
            readOnly={lockSlug}
            maxLength={255}
            className={`${inputClass} ${lockSlug ? "cursor-not-allowed bg-surface-100" : ""}`}
          />
        </div>
        <div className="w-32">
          <label className="mb-1 block text-sm font-medium text-surface-700">
            {t("locale")}
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={inputClass}
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">
          {t("title")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={255}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-surface-700">
          {t("content")}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={16}
          className={`${inputClass} resize-y font-mono`}
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <label className="mb-1 block text-sm font-medium text-surface-700">
            {t("status")}
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={inputClass}
          >
            <option value="draft">{t("statusDraft")}</option>
            <option value="published">{t("statusPublished")}</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-surface-700">
            {t("publishedAt")}
          </label>
          <input
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-surface-700">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="size-4 rounded border-surface-300"
        />
        {t("pinned")}
        <span className="text-xs text-surface-400">{t("pinnedHint")}</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/announcements")}
          className="rounded border border-surface-300 px-5 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
