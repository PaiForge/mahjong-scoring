"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import toast from "react-hot-toast";

import { Button } from "@/app/(user)/_components/button";
import { dispatchNotificationsRead } from "@/lib/notifications/read-event";

import { markAllNotificationsReadAction } from "../_actions/mark-read";

/**
 * 「すべて既読にする」
 * 全既読ボタン
 *
 * 既読にしたら一覧を取り直し（`router.refresh()`）、ベルにも知らせる。
 * 未読が無いときはページ側が描かない。
 */
export function MarkAllReadButton() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if ("error" in result) {
        toast.error(t("markAllReadFailed"));
        return;
      }
      dispatchNotificationsRead();
      router.refresh();
    });
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {t("markAllRead")}
    </Button>
  );
}
