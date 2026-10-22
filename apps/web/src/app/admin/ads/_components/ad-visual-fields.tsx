import { useTranslations } from "next-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { parseHais } from "@mahjong-scoring/core";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/images/policy";
import { AD_CREATIVE_LIMITS } from "../_lib/validation";
import {
  AD_FORM_HINT_CLASS,
  AD_FORM_INPUT_CLASS,
  AD_FORM_LABEL_CLASS,
} from "./ad-form-classes";

/** 見た目の欄の値 */
export interface AdVisualValues {
  readonly icon: string;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly hand: string;
}

/**
 * 見た目の欄（絵文字・画像と代替テキスト・手牌）
 * 見た目の欄
 *
 * 画像は選んだ時点でアップロードし、返ってきた URL を値として持つ。
 * 手牌の欄はカード型のスロットだけに出す（行型は帯を持たない）。入力中の
 * 表記は牌に直して下に並べ、読めているかをその場で確かめられるようにする。
 */
export function AdVisualFields({
  values,
  acceptsHand,
  isUploading,
  onChange,
  onImageFile,
}: {
  readonly values: AdVisualValues;
  /** 手牌の欄を出すか（カード型のスロット） */
  readonly acceptsHand: boolean;
  readonly isUploading: boolean;
  readonly onChange: (patch: Partial<AdVisualValues>) => void;
  /** 画像ファイルを選んだ */
  readonly onImageFile: (file: File) => void;
}) {
  const t = useTranslations("admin.ads");
  const { icon, imageUrl, imageAlt, hand } = values;
  const handTiles = parseHais(hand.trim());
  return (
    <>
      <div className="flex flex-wrap gap-6">
        <div className="w-32">
          <label htmlFor="ad-icon" className={AD_FORM_LABEL_CLASS}>
            {t("icon")}
          </label>
          <input
            id="ad-icon"
            type="text"
            value={icon}
            onChange={(e) => onChange({ icon: e.target.value })}
            placeholder="📘"
            maxLength={AD_CREATIVE_LIMITS.icon}
            className={AD_FORM_INPUT_CLASS}
          />
        </div>
        <div className="min-w-60 flex-1">
          <label htmlFor="ad-image" className={AD_FORM_LABEL_CLASS}>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageFile(file);
                }}
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
                  onClick={() => onChange({ imageUrl: "", imageAlt: "" })}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  {t("imageRemove")}
                </button>
              )}
            </div>
          </div>
          <p className={AD_FORM_HINT_CLASS}>{t("imageHint")}</p>
        </div>
      </div>
      <p className="-mt-3 text-xs text-surface-400">{t("iconHint")}</p>

      {imageUrl !== "" && (
        <div>
          <label htmlFor="ad-image-alt" className={AD_FORM_LABEL_CLASS}>
            {t("imageAlt")}
          </label>
          <input
            id="ad-image-alt"
            type="text"
            value={imageAlt}
            onChange={(e) => onChange({ imageAlt: e.target.value })}
            maxLength={AD_CREATIVE_LIMITS.imageAlt}
            className={AD_FORM_INPUT_CLASS}
          />
        </div>
      )}

      {acceptsHand && (
        <div>
          <label htmlFor="ad-hand" className={AD_FORM_LABEL_CLASS}>
            {t("hand")}
          </label>
          <input
            id="ad-hand"
            type="text"
            value={hand}
            onChange={(e) => onChange({ hand: e.target.value })}
            placeholder="123m456p789s11z"
            maxLength={AD_CREATIVE_LIMITS.hand}
            className={`${AD_FORM_INPUT_CLASS} font-mono`}
          />
          <p className={AD_FORM_HINT_CLASS}>{t("handHint")}</p>
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
    </>
  );
}
