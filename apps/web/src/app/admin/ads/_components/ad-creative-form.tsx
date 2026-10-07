"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { parseHais } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";
import {
  counterpartSlot,
  isAdSlot,
  kindForSlot,
  platformForSlot,
  surfacesForSlot,
} from "@/lib/ads/registry";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { callApi } from "@/lib/api-client";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/images/policy";

import { createAdCreative } from "../_actions/create-ad-creative";
import { updateAdCreative } from "../_actions/update-ad-creative";
import { adsSlotHref } from "../_lib/list-href";
import { AD_CREATIVE_LIMITS, type AdCreativeInput } from "../_lib/validation";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";

/** 編集時の初期値（`AdCreativeInput` から slot を除いたもの） */
export type AdCreativeFormDefaults = Omit<AdCreativeInput, "slot">;

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
  const [isUploading, setIsUploading] = useState(false);

  const [asin, setAsin] = useState(defaultValues?.asin ?? "");
  const [href, setHref] = useState(defaultValues?.href ?? "");
  const usesAsin = asin.trim() !== "";
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? false);
  const [icon, setIcon] = useState(defaultValues?.icon ?? "");
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(defaultValues?.imageAlt ?? "");
  const [hand, setHand] = useState(defaultValues?.hand ?? "");
  const knownSlot = isAdSlot(slot) ? slot : undefined;
  const acceptsHand =
    knownSlot !== undefined && kindForSlot(knownSlot) === "native_card";
  const platform =
    knownSlot !== undefined ? platformForSlot(knownSlot) : undefined;
  const webCounterpart =
    platform === "mobile" && knownSlot !== undefined
      ? counterpartSlot(knownSlot)
      : undefined;
  const webPreviewHrefs =
    webCounterpart !== undefined
      ? surfacesForSlot(webCounterpart).flatMap((surface) =>
          surface.href !== undefined ? [surface.href] : [],
        )
      : [];
  // 一覧の、このスロットのあるタブと位置へ戻る
  const backHref =
    knownSlot !== undefined ? adsSlotHref(knownSlot) : "/admin/ads";
  const handTiles = parseHais(hand.trim());
  const [title, setTitle] = useState<Record<string, string>>({
    ...emptyByLocale(),
    ...defaultValues?.title,
  });
  const [description, setDescription] = useState<Record<string, string>>({
    ...emptyByLocale(),
    ...defaultValues?.description,
  });

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return;
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
      return;
    }
    setImageUrl(result.data.url);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const data: AdCreativeInput = {
        slot,
        asin,
        href,
        isActive,
        icon,
        imageUrl,
        imageAlt,
        hand: acceptsHand ? hand : "",
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

  const inputClass = `w-full ${ADMIN_INPUT_CLASSES}`;
  const labelClass = "mb-1 block text-sm font-medium text-surface-700";
  const hintClass = "mt-1 text-xs text-surface-400";

  return (
    <div className="admin-panel max-w-3xl space-y-5 p-5 sm:p-7">
      <div>
        <p className={labelClass}>{t("slot")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm text-surface-800">{slot}</code>
          {platform !== undefined && (
            <span className={adminChipClasses("neutral")}>
              {t(`platforms.${platform}`)}
            </span>
          )}
        </div>
        {webPreviewHrefs.length > 0 && (
          <p className={hintClass}>
            {t("webPreview")}:{" "}
            {webPreviewHrefs.map((previewHref, i) => (
              <span key={previewHref}>
                {i > 0 && ", "}
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  className={TEXT_LINK_CLASSES}
                >
                  {previewHref}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="ad-asin" className={labelClass}>
          {t("asin")}
        </label>
        <input
          id="ad-asin"
          type="text"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          placeholder="B08721VWS5"
          className={`${inputClass} font-mono`}
        />
        <p className={hintClass}>{t("asinHint")}</p>
      </div>

      <div>
        <label htmlFor="ad-href" className={labelClass}>
          {t("href")}
        </label>
        <input
          id="ad-href"
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://"
          maxLength={AD_CREATIVE_LIMITS.href}
          disabled={usesAsin}
          className={inputClass}
        />
        <p className={hintClass}>{t("hrefHint")}</p>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="w-32">
          <label htmlFor="ad-icon" className={labelClass}>
            {t("icon")}
          </label>
          <input
            id="ad-icon"
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📘"
            maxLength={AD_CREATIVE_LIMITS.icon}
            className={inputClass}
          />
        </div>
        <div className="min-w-60 flex-1">
          <label htmlFor="ad-image" className={labelClass}>
            {t("image")}
          </label>
          <div className="flex items-start gap-3">
            {imageUrl !== "" && (
              // 管理画面のプレビュー。next/image を通すと remotePatterns に
              // 合わない URL（検証前の値）で落ちるため素の img で出す
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="size-20 shrink-0 rounded border border-surface-200 object-contain"
              />
            )}
            <div className="space-y-2">
              <input
                id="ad-image"
                type="file"
                accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
                disabled={isUploading}
                onChange={(e) => void handleImageChange(e.target.files?.[0])}
                className="text-sm text-surface-700"
              />
              {isUploading && (
                <p className="text-xs text-surface-500">
                  {t("imageUploading")}
                </p>
              )}
              {imageUrl !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageAlt("");
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  {t("imageRemove")}
                </button>
              )}
            </div>
          </div>
          <p className={hintClass}>{t("imageHint")}</p>
        </div>
      </div>
      <p className="-mt-3 text-xs text-surface-400">{t("iconHint")}</p>

      {imageUrl !== "" && (
        <div>
          <label htmlFor="ad-image-alt" className={labelClass}>
            {t("imageAlt")}
          </label>
          <input
            id="ad-image-alt"
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            maxLength={AD_CREATIVE_LIMITS.imageAlt}
            className={inputClass}
          />
        </div>
      )}

      {acceptsHand && (
        <div>
          <label htmlFor="ad-hand" className={labelClass}>
            {t("hand")}
          </label>
          <input
            id="ad-hand"
            type="text"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
            placeholder="123m456p789s11z"
            maxLength={AD_CREATIVE_LIMITS.hand}
            className={`${inputClass} font-mono`}
          />
          <p className={hintClass}>{t("handHint")}</p>
          {hand.trim() !== "" && (
            <div className="mt-2 flex min-h-8 items-center">
              {handTiles.length > 0 ? (
                <div className="flex gap-0.5">
                  {handTiles.map((hai, i) => (
                    <Hai key={i} hai={hai} size="xs" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-600">{t("handPreviewEmpty")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {SUPPORTED_LOCALES.map((locale) => (
        <fieldset
          key={locale}
          className="space-y-3 rounded border border-surface-200 p-4"
        >
          <legend className="px-1 text-sm font-semibold text-surface-800">
            {t("copyHeading", { locale })}
            <span className="ml-2 text-xs font-normal text-surface-400">
              {locale === DEFAULT_LOCALE
                ? t("copyRequired")
                : t("copyOptional")}
            </span>
          </legend>
          <div>
            <label htmlFor={`ad-title-${locale}`} className={labelClass}>
              {t("copyTitle")}
            </label>
            <input
              id={`ad-title-${locale}`}
              type="text"
              value={title[locale] ?? ""}
              onChange={(e) =>
                setTitle((prev) => ({ ...prev, [locale]: e.target.value }))
              }
              maxLength={AD_CREATIVE_LIMITS.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`ad-description-${locale}`} className={labelClass}>
              {t("copyDescription")}
            </label>
            <textarea
              id={`ad-description-${locale}`}
              value={description[locale] ?? ""}
              onChange={(e) =>
                setDescription((prev) => ({
                  ...prev,
                  [locale]: e.target.value,
                }))
              }
              maxLength={AD_CREATIVE_LIMITS.description}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>
        </fieldset>
      ))}

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
