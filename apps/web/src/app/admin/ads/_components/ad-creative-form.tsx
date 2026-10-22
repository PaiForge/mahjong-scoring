"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { isAdSlot, kindForSlot } from "@/lib/ads/registry";

import { createAdCreative } from "../_actions/create-ad-creative";
import { updateAdCreative } from "../_actions/update-ad-creative";
import { adsSlotHref } from "../_lib/list-href";
import type { AdCreativeInput } from "../_lib/validation";
import { adminButtonClasses } from "../../_lib/button-classes";
import { AdCopyFields } from "./ad-copy-fields";
import { AdLinkFields } from "./ad-link-fields";
import { AdSlotHeader } from "./ad-slot-header";
import { AdVisualFields, type AdVisualValues } from "./ad-visual-fields";
import { useAdImageUpload } from "./use-ad-image-upload";

/** 編集時の初期値（`AdCreativeInput` から slot を除いたもの） */
type AdCreativeFormDefaults = Omit<AdCreativeInput, "slot">;

interface Props {
  readonly mode: "create" | "edit";
  readonly slot: string;
  readonly creativeId?: string;
  readonly defaultValues?: AdCreativeFormDefaults;
}

/** ロケールごとの空欄 */
function emptyByLocale(): Record<string, string> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, ""]));
}

/**
 * 広告の作成・編集フォーム
 * 広告フォーム
 *
 * 画像は選んだ時点で `/api/admin/ads/image` に送り、返ってきた URL を
 * フォームの値として持つ。保存時は URL だけを送る（Server Action に画像の
 * バイト列を載せない）。
 *
 * スロットは作成時に決まり、編集では変えない（`updateAdCreative` 参照）。
 * スロットの横にどちら（web / アプリ）の画面に出るかを示し、アプリの
 * スロットには web の同じ画面のリンクを添える — アプリの画面はブラウザで
 * 開けないが、置かれる位置は web と同じなのでそこで確かめられる。
 * 手牌の欄はカード型のスロットだけに出す（行型は帯を持たない）。入力中の
 * 表記は牌に直して下に並べ、読めているかをその場で確かめられるようにする。
 */
export function AdCreativeForm({
  mode,
  slot,
  creativeId,
  defaultValues,
}: Props) {
  const router = useRouter();
  const t = useTranslations("admin.ads");
  const [isPending, startTransition] = useTransition();
  const { isUploading, upload } = useAdImageUpload();

  const [asin, setAsin] = useState(defaultValues?.asin ?? "");
  const [href, setHref] = useState(defaultValues?.href ?? "");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? false);
  const [visual, setVisual] = useState<AdVisualValues>({
    icon: defaultValues?.icon ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
    imageAlt: defaultValues?.imageAlt ?? "",
    hand: defaultValues?.hand ?? "",
  });
  const [title, setTitle] = useState<Record<string, string>>({
    ...emptyByLocale(),
    ...defaultValues?.title,
  });
  const [description, setDescription] = useState<Record<string, string>>({
    ...emptyByLocale(),
    ...defaultValues?.description,
  });
  const knownSlot = isAdSlot(slot) ? slot : undefined;
  const acceptsHand =
    knownSlot !== undefined && kindForSlot(knownSlot) === "native_card";
  // 一覧の、このスロットのあるタブと位置へ戻る
  const backHref =
    knownSlot !== undefined ? adsSlotHref(knownSlot) : "/admin/ads";

  const handleImageFile = async (file: File) => {
    const url = await upload(file);
    if (url !== undefined) setVisual((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const data: AdCreativeInput = {
        slot,
        asin,
        href,
        isActive,
        ...visual,
        hand: acceptsHand ? visual.hand : "",
        title,
        description,
      };
      const result =
        mode === "edit" && creativeId
          ? await updateAdCreative(creativeId, data)
          : await createAdCreative(data);

      if ("error" in result) {
        toast.error(t(result.error));
        return;
      }

      toast.success(t(mode === "edit" ? "updatedToast" : "createdToast"));
      router.push(backHref);
      router.refresh();
    });
  };

  return (
    <div className="admin-panel max-w-3xl space-y-5 p-5 sm:p-7">
      <AdSlotHeader slot={slot} />

      <AdLinkFields
        asin={asin}
        href={href}
        onAsinChange={setAsin}
        onHrefChange={setHref}
      />

      <AdVisualFields
        values={visual}
        acceptsHand={acceptsHand}
        isUploading={isUploading}
        onChange={(patch) => setVisual((prev) => ({ ...prev, ...patch }))}
        onImageFile={(file) => void handleImageFile(file)}
      />

      <AdCopyFields
        title={title}
        description={description}
        onTitleChange={(locale, value) =>
          setTitle((prev) => ({ ...prev, [locale]: value }))
        }
        onDescriptionChange={(locale, value) =>
          setDescription((prev) => ({ ...prev, [locale]: value }))
        }
      />

      <label className="flex items-center gap-2 text-sm text-surface-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 rounded border-surface-300"
        />
        {t("isActive")}
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || isUploading}
          className={adminButtonClasses()}
        >
          {isPending ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className={adminButtonClasses({ variant: "secondary" })}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
