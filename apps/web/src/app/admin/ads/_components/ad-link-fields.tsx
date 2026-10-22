import { useTranslations } from "next-intl";
import { AD_CREATIVE_LIMITS } from "../_lib/validation";
import {
  AD_FORM_HINT_CLASS,
  AD_FORM_INPUT_CLASS,
  AD_FORM_LABEL_CLASS,
} from "./ad-form-classes";

/**
 * リンクの欄（ASIN か URL のどちらか一方）
 * リンクの欄
 *
 * ASIN が入っていれば URL は使わないので、URL の欄を押せなくする。
 */
export function AdLinkFields({
  asin,
  href,
  onAsinChange,
  onHrefChange,
}: {
  readonly asin: string;
  readonly href: string;
  readonly onAsinChange: (value: string) => void;
  readonly onHrefChange: (value: string) => void;
}) {
  const t = useTranslations("admin.ads");
  return (
    <>
      <div>
        <label htmlFor="ad-asin" className={AD_FORM_LABEL_CLASS}>
          {t("asin")}
        </label>
        <input
          id="ad-asin"
          type="text"
          value={asin}
          onChange={(e) => onAsinChange(e.target.value)}
          placeholder="B08721VWS5"
          className={`${AD_FORM_INPUT_CLASS} font-mono`}
        />
        <p className={AD_FORM_HINT_CLASS}>{t("asinHint")}</p>
      </div>

      <div>
        <label htmlFor="ad-href" className={AD_FORM_LABEL_CLASS}>
          {t("href")}
        </label>
        <input
          id="ad-href"
          type="url"
          value={href}
          onChange={(e) => onHrefChange(e.target.value)}
          placeholder="https://"
          maxLength={AD_CREATIVE_LIMITS.href}
          disabled={asin.trim() !== ""}
          className={AD_FORM_INPUT_CLASS}
        />
        <p className={AD_FORM_HINT_CLASS}>{t("hrefHint")}</p>
      </div>
    </>
  );
}
