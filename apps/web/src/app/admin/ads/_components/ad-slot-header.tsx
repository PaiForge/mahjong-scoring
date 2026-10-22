import { useTranslations } from "next-intl";
import {
  counterpartSlot,
  isAdSlot,
  platformForSlot,
  surfacesForSlot,
} from "@/lib/ads/registry";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { adminChipClasses } from "../../_lib/chip-classes";
import { AD_FORM_HINT_CLASS, AD_FORM_LABEL_CLASS } from "./ad-form-classes";

/**
 * フォームの先頭のスロットの表示
 * スロットの見出し
 *
 * スロットは作成時に決まり、編集では変えない。横にどちら（web / アプリ）の
 * 画面に出るかを示し、アプリのスロットには web の同じ画面のリンクを添える —
 * アプリの画面はブラウザで開けないが、置かれる位置は web と同じなので
 * そこで確かめられる。
 */
export function AdSlotHeader({ slot }: { readonly slot: string }) {
  const t = useTranslations("admin.ads");
  const knownSlot = isAdSlot(slot) ? slot : undefined;
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
  return (
    <div>
      <p className={AD_FORM_LABEL_CLASS}>{t("slot")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm text-surface-800">{slot}</code>
        {platform !== undefined && (
          <span className={adminChipClasses("neutral")}>
            {t(`platforms.${platform}`)}
          </span>
        )}
      </div>
      {webPreviewHrefs.length > 0 && (
        <p className={AD_FORM_HINT_CLASS}>
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
  );
}
