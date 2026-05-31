"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { deleteAnnouncement } from "../_actions/delete-announcement";

interface Props {
  readonly announcementId: string;
}

export function DeleteAnnouncementButton({ announcementId }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.announcements");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAnnouncement(announcementId);
      if ("error" in result) {
        toast.error(t(result.error));
        return;
      }
      toast.success(t("deletedToast"));
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
