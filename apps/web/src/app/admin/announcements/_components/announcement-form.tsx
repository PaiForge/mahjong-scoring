"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { toJstDateTimeLocal } from "@mahjong-scoring/features/jst";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { AnnouncementStatus } from "@/lib/announcement-status";

import { createAnnouncement } from "../_actions/create-announcement";
import { updateAnnouncement } from "../_actions/update-announcement";
import { adminButtonClasses } from "../../_lib/button-classes";
import {
  AnnouncementBodyFields,
  AnnouncementIdentityFields,
  AnnouncementPublishFields,
} from "./announcement-fields";

interface AnnouncementFormDefaults {
  slug: string;
  title: string;
  content: string;
  locale: string;
  status: string;
  /** 公開日時（JST の datetime-local の値。`toJstDateTimeLocal` で作る） */
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
  const [status, setStatus] = useState(
    defaultValues?.status ?? AnnouncementStatus.Draft,
  );
  // 入力欄の値は JST の壁時計のまま持ち、瞬間への変換はサーバーに任せる。
  // ブラウザで `new Date()` に通すと端末のタイムゾーンで読まれる
  const [publishedAtLocal, setPublishedAtLocal] = useState(
    defaultValues?.publishedAt ?? "",
  );
  const [pinned, setPinned] = useState(defaultValues?.pinned ?? false);

  const handleStatusChange = (next: string) => {
    setStatus(next);
    if (next === AnnouncementStatus.Published && publishedAtLocal === "") {
      setPublishedAtLocal(toJstDateTimeLocal(new Date()));
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
        publishedAt: publishedAtLocal || null,
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

  return (
    <div className="admin-panel max-w-3xl space-y-5 p-5 sm:p-7">
      <AnnouncementIdentityFields
        slug={slug}
        locale={locale}
        lockSlug={lockSlug}
        onSlugChange={setSlug}
        onLocaleChange={setLocale}
      />
      <AnnouncementBodyFields
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
      />
      <AnnouncementPublishFields
        status={status}
        publishedAtLocal={publishedAtLocal}
        pinned={pinned}
        onStatusChange={handleStatusChange}
        onPublishedAtChange={setPublishedAtLocal}
        onPinnedChange={setPinned}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={adminButtonClasses()}
        >
          {isPending ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/announcements")}
          className={adminButtonClasses({ variant: "secondary" })}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
